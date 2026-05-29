#!/usr/bin/env node
/**
 * i18n extractor — scans `src/**` for `t('Namespace.key')` literals and
 * uploads the resulting manifest to `POST /api/ci/i18n/manifest`.
 *
 * Usage:
 *   pnpm run i18n:extract
 *   pnpm run i18n:extract -- --dry-run        # print manifest, no upload
 *   pnpm run i18n:extract -- --out manifest.json
 *
 * Configuration (env-first; `.env.local` is read as a fallback):
 *   KNOTA_API_BASE   default: http://localhost:5150
 *   KNOTA_CI_TOKEN   required unless --dry-run
 *
 * Why regex instead of a real parser? Throughput + zero TS dep. The grammar
 * we accept is intentionally restrictive: only string literals for both the
 * key (1st arg) and the optional source-text default (2nd arg). Dynamic
 * keys (`t(\`Foo.${x}\`)`) are flagged as warnings so devs catch them
 * locally — they would silently bypass the manifest and thus never land in
 * the DB. A 2nd arg that isn't a plain string literal (template, ident,
 * object, ...) is silently ignored: the entry is still uploaded, just
 * without `sourceText`, and the backend leaves zh-CN untouched.
 *
 * See `system-design/国际化.md` §13 for the manifest contract.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { argv, cwd, env, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

// ── Constants (mirror backend caps in views/i18n.rs) ────────────────────────

const MAX_MANIFEST_ENTRIES = 50_000;
const MAX_LOCATIONS_PER_ENTRY = 64;
/// Mirror backend `i18n_manifest_service::MAX_SOURCE_TEXT_LEN`. Anything
/// larger is dropped client-side with a warning so we never POST a payload
/// the backend will reject — keeps the failure mode local and obvious.
const MAX_SOURCE_TEXT_LEN = 2048;
const NAMESPACE_RE = /^[A-Za-z0-9._]{1,64}$/;
const KEY_RE = /^[A-Za-z0-9._-]{1,256}$/;

// Match `t('ns.key', ...)` / `t("ns.key", ...)`. We deliberately reject
// template literals — dynamic keys can't be statically extracted and need
// to be hoisted to a constant.
//
// Group 1: opening quote of the key
// Group 2: key literal
// Group 3: opening quote of the source-text 2nd arg (optional)
// Group 4: source-text literal (optional)
//
// The 2nd-arg branch is intentionally narrow: only string literals quoted
// with `'` or `"`. Template literals, identifiers, function calls, and
// objects are not captured — those are either dynamic (no static text to
// store) or the legacy params-as-2nd-arg pattern that is now banned by
// AGENTS.md. Missing 2nd arg → no `sourceText` on the manifest entry; the
// backend then leaves the zh-CN baseline untouched.
const T_CALL_RE =
  /\bt\(\s*(['"])((?:\\.|(?!\1).)+)\1(?:\s*,\s*(['"])((?:\\.|(?!\3).)*)\3)?/g;
const T_TEMPLATE_RE = /\bt\(\s*`/g;

// ── Argv parsing ────────────────────────────────────────────────────────────

const ARG_FLAGS = new Set(['--dry-run', '--help', '-h']);
const ARG_OPTIONS = new Set(['--out', '--api', '--token', '--src']);

const parseArgs = (raw) => {
  const opts = { dryRun: false, out: null, api: null, token: null, src: null };
  for (let i = 2; i < raw.length; i++) {
    const a = raw[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (ARG_OPTIONS.has(a)) {
      const v = raw[++i];
      if (!v || v.startsWith('--')) {
        throw new Error(`Missing value for ${a}`);
      }
      if (a === '--out') opts.out = v;
      if (a === '--api') opts.api = v;
      if (a === '--token') opts.token = v;
      if (a === '--src') opts.src = v;
    } else if (!ARG_FLAGS.has(a)) {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
};

const printHelp = () => {
  console.log(`Usage: pnpm run i18n:extract [-- options]

Options:
  --dry-run         Print manifest summary, do not upload
  --out <file>      Write manifest JSON to <file>
  --api <url>       Override KNOTA_API_BASE
  --token <token>   Override KNOTA_CI_TOKEN
  --src <dir>       Source root (default: src)
  -h, --help        Show this help

Env (fallback to .env.local in cwd):
  KNOTA_API_BASE    default http://localhost:5150
  KNOTA_CI_TOKEN    required for upload`);
};

// ── .env.local loader (best-effort, no deps) ────────────────────────────────

/**
 * Minimal `.env` parser. Only handles `KEY=value` and `KEY="value"`. We
 * never want to depend on `dotenv` for a single-file CLI.
 */
const loadDotEnv = async (cwdDir) => {
  const path = join(cwdDir, '.env.local');
  try {
    const raw = await readFile(path, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Don't clobber explicit env vars — env wins over file.
      if (env[key] === undefined) env[key] = value;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[i18n-extract] failed to read .env.local: ${err.message}`);
    }
  }
};

// ── Source walker ───────────────────────────────────────────────────────────

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
]);

const walk = async (root) => {
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) stack.push(full);
      } else if (e.isFile()) {
        const dot = e.name.lastIndexOf('.');
        if (dot < 0) continue;
        if (SCAN_EXTS.has(e.name.slice(dot))) out.push(full);
      }
    }
  }
  return out;
};

// ── Extraction ──────────────────────────────────────────────────────────────

/**
 * Parse a single file. Returns `{matches, dynamic, oversizedSources}`:
 * - `matches`: literal `t()` calls (with optional `sourceText`).
 * - `dynamic`: count of template-literal calls deliberately skipped.
 * - `oversizedSources`: human-readable locations whose 2nd-arg source text
 *   exceeded `MAX_SOURCE_TEXT_LEN` and was dropped (entry still recorded).
 */
const extractFromSource = (source, relPath) => {
  const matches = [];
  const oversizedSources = [];
  let dynamic = 0;

  // Build a (offset → 1-based line) index so we can attach line numbers
  // without scanning the prefix on every match.
  const lineOffsets = [0];
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10) lineOffsets.push(i + 1);
  }
  const lineOf = (offset) => {
    let lo = 0;
    let hi = lineOffsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (lineOffsets[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  T_CALL_RE.lastIndex = 0;
  while (true) {
    const m = T_CALL_RE.exec(source);
    if (m === null) break;
    const literal = m[2];
    // Reject keys with backslash escapes — likely a typo or a dynamic key
    // that someone string-concat'd; skip silently.
    if (literal.includes('\\')) continue;
    const dot = literal.indexOf('.');
    if (dot <= 0 || dot === literal.length - 1) continue;
    const ns = literal.slice(0, dot);
    const key = literal.slice(dot + 1);
    if (!NAMESPACE_RE.test(ns) || !KEY_RE.test(key)) continue;

    // Optional 2nd-arg source text. We unescape the two escapes JS string
    // literals require inside the matching quote: `\'` `\"` `\\` and `\n`.
    // Anything fancier (Unicode escapes, octal) is rare in human-written
    // Chinese UI strings and would require a real lexer.
    let sourceText;
    if (m[4] !== undefined) {
      const raw = m[4];
      const unescaped = raw.replace(/\\(['"\\nrt])/g, (_, ch) => {
        if (ch === 'n') return '\n';
        if (ch === 'r') return '\r';
        if (ch === 't') return '\t';
        return ch;
      });
      if (unescaped.length === 0) {
        // Empty literal `''` — treat as "no source text" so we don't blank
        // out a possibly-good DB row.
        sourceText = undefined;
      } else if (unescaped.length > MAX_SOURCE_TEXT_LEN) {
        // Drop with a warning rather than POST a payload the backend will
        // 400 on. The call site is still recorded.
        sourceText = undefined;
        oversizedSources.push(
          `${relPath.split(sep).join('/')}:${lineOf(m.index)} (${ns}.${key}, ${unescaped.length} chars)`,
        );
      } else {
        sourceText = unescaped;
      }
    }

    matches.push({
      namespace: ns,
      key,
      filePath: relPath.split(sep).join('/'),
      line: lineOf(m.index),
      sourceText,
    });
  }

  T_TEMPLATE_RE.lastIndex = 0;
  while (T_TEMPLATE_RE.exec(source) !== null) dynamic++;

  return { matches, dynamic, oversizedSources };
};

/**
 * Aggregate per-file matches into the canonical manifest shape: one entry
 * per `(namespace, key)` with deduped + sorted locations capped at
 * `MAX_LOCATIONS_PER_ENTRY` (extras dropped, oldest-first preserved).
 *
 * `sourceText` resolution: the first non-empty value wins (in iteration
 * order — typically file walk order, which is stable per run). Conflicts
 * (different non-empty values for the same `(ns, key)`) are recorded in
 * `sourceConflicts` so devs can see drift between call sites; the first
 * value is what gets uploaded so the DB has *something* to seed from.
 */
const buildManifest = (allMatches) => {
  // Each bucket tracks every distinct sourceText we saw + the call sites
  // that produced it. The downstream `fix-i18n-conflicts` script reads
  // `candidates` to compute majority votes and rewrite source files; the
  // upload path only needs `sourceText` (winner) and `locations`. The
  // winner is "first non-empty in iteration order" — same as before, kept
  // deterministic by the per-file walk order being stable per run.
  const grouped = new Map(); // `${ns}::${key}` → bucket (see below)
  for (const m of allMatches) {
    const k = `${m.namespace}::${m.key}`;
    let bucket = grouped.get(k);
    if (!bucket) {
      bucket = {
        locations: new Map(), // locKey → { filePath, line }
        candidates: new Map(), // sourceText → Location[]
        sourceText: undefined, // winner: first non-empty seen
        sourceLocation: undefined, // winner's locKey for diagnostics
      };
      grouped.set(k, bucket);
    }
    const locKey = `${m.filePath}:${m.line}`;
    const loc = { filePath: m.filePath, line: m.line };
    if (!bucket.locations.has(locKey)) {
      bucket.locations.set(locKey, loc);
    }
    if (m.sourceText !== undefined) {
      let bag = bucket.candidates.get(m.sourceText);
      if (!bag) {
        bag = [];
        bucket.candidates.set(m.sourceText, bag);
      }
      bag.push(loc);
      if (bucket.sourceText === undefined) {
        bucket.sourceText = m.sourceText;
        bucket.sourceLocation = locKey;
      }
    }
  }

  const entries = [];
  const conflicts = []; // structured: consumed by both warn output and fix script
  let droppedLocations = 0;
  for (const [k, bucket] of grouped) {
    const [namespace, key] = k.split('::');
    const locations = Array.from(bucket.locations.values()).sort(
      (a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line,
    );
    if (locations.length > MAX_LOCATIONS_PER_ENTRY) {
      droppedLocations += locations.length - MAX_LOCATIONS_PER_ENTRY;
      locations.length = MAX_LOCATIONS_PER_ENTRY;
    }
    const entry = { namespace, key, locations };
    if (bucket.sourceText !== undefined) {
      entry.sourceText = bucket.sourceText;
    }
    entries.push(entry);
    if (bucket.candidates.size > 1) {
      // Stable, sorted candidate list — easier diffing across runs and
      // makes "majority vote, ties broken by first-seen" reproducible.
      const candidateList = Array.from(bucket.candidates, ([text, locs]) => ({
        sourceText: text,
        locations: locs
          .slice()
          .sort(
            (a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line,
          ),
      })).sort((a, b) => b.locations.length - a.locations.length);
      conflicts.push({
        namespace,
        key,
        winner: bucket.sourceText,
        winnerLocation: bucket.sourceLocation,
        candidates: candidateList,
      });
    }
  }
  // Stable order: namespace asc, then key asc.
  entries.sort(
    (a, b) =>
      a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key),
  );
  conflicts.sort(
    (a, b) =>
      a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key),
  );

  // Backwards-compat warning lines (extractor's --dry-run summary still
  // prints these). The fix script reads `conflicts` directly.
  const sourceConflicts = conflicts.map(
    (c) =>
      `${c.namespace}.${c.key}: kept "${c.winner}" from ${c.winnerLocation}; ${c.candidates.length - 1} other variant(s) at ${c.candidates
        .filter((v) => v.sourceText !== c.winner)
        .flatMap((v) => v.locations.map((l) => `${l.filePath}:${l.line}`))
        .join(', ')}`,
  );

  return { entries, droppedLocations, sourceConflicts, conflicts };
};

/**
 * Walk `srcDir` and return every literal `t()` call site. Shared by the
 * upload path here and `fix-i18n-conflicts.mjs`. Returns aggregate stats
 * alongside the raw matches so callers don't have to recompute them.
 */
const collectMatches = async (srcDir, root) => {
  const files = await walk(srcDir);
  const allMatches = [];
  let totalDynamic = 0;
  const dynamicFiles = [];
  const allOversized = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const rel = relative(root, file);
    const { matches, dynamic, oversizedSources } = extractFromSource(
      source,
      rel,
    );
    if (matches.length > 0) allMatches.push(...matches);
    if (dynamic > 0) {
      totalDynamic += dynamic;
      dynamicFiles.push(`${rel} (${dynamic})`);
    }
    if (oversizedSources.length > 0) allOversized.push(...oversizedSources);
  }
  return { files, allMatches, totalDynamic, dynamicFiles, allOversized };
};

// ── Upload ──────────────────────────────────────────────────────────────────

const uploadManifest = async ({ apiBase, token, manifest }) => {
  const url = `${apiBase.replace(/\/$/, '')}/api/ci/i18n/manifest`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-ci-token': token,
    },
    body: JSON.stringify(manifest),
  });
  const text = await resp.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!resp.ok) {
    const reason = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(
      `Upload failed: HTTP ${resp.status} ${resp.statusText} — ${reason}`,
    );
  }
  return body;
};

// ── Main ────────────────────────────────────────────────────────────────────

const main = async () => {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(err.message);
    printHelp();
    exit(2);
  }
  if (opts.help) {
    printHelp();
    return;
  }

  const root = cwd();
  await loadDotEnv(root);

  const apiBase = opts.api ?? env.KNOTA_API_BASE ?? 'http://localhost:5150';
  const token = opts.token ?? env.KNOTA_CI_TOKEN ?? null;
  const srcDir = resolve(root, opts.src ?? 'src');

  console.log(`[i18n-extract] scanning ${relative(root, srcDir) || srcDir}`);
  const { files, allMatches, totalDynamic, dynamicFiles, allOversized } =
    await collectMatches(srcDir, root);
  console.log(`[i18n-extract] found ${files.length} source files`);

  const { entries, droppedLocations, sourceConflicts } =
    buildManifest(allMatches);

  if (entries.length > MAX_MANIFEST_ENTRIES) {
    console.error(
      `[i18n-extract] entry count ${entries.length} exceeds backend cap ${MAX_MANIFEST_ENTRIES}`,
    );
    exit(3);
  }

  const withSource = entries.reduce(
    (n, e) => n + (e.sourceText !== undefined ? 1 : 0),
    0,
  );
  console.log(
    `[i18n-extract] extracted ${allMatches.length} call sites → ${entries.length} unique entries (${withSource} with sourceText)`,
  );
  if (droppedLocations > 0) {
    console.warn(
      `[i18n-extract] ${droppedLocations} location(s) dropped (cap=${MAX_LOCATIONS_PER_ENTRY}/entry)`,
    );
  }
  if (totalDynamic > 0) {
    console.warn(
      `[i18n-extract] ${totalDynamic} dynamic t() call(s) skipped — hoist keys to literals:`,
    );
    for (const f of dynamicFiles) console.warn(`  - ${f}`);
  }
  if (allOversized.length > 0) {
    console.warn(
      `[i18n-extract] ${allOversized.length} source-text default(s) exceed ${MAX_SOURCE_TEXT_LEN} chars and were dropped:`,
    );
    for (const o of allOversized) console.warn(`  - ${o}`);
  }
  if (sourceConflicts.length > 0) {
    console.warn(
      `[i18n-extract] ${sourceConflicts.length} key(s) have inconsistent sourceText across call sites:`,
    );
    for (const c of sourceConflicts) console.warn(`  - ${c}`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    commitSha: env.GIT_COMMIT_SHA ?? null,
    entries,
  };

  if (opts.out) {
    const outPath = resolve(root, opts.out);
    await writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[i18n-extract] wrote manifest to ${relative(root, outPath)}`);
  }

  if (opts.dryRun) {
    console.log('[i18n-extract] dry-run — skipping upload');
    return;
  }

  if (!token) {
    console.error(
      '[i18n-extract] KNOTA_CI_TOKEN missing. Set it in env or .env.local, or pass --token.',
    );
    exit(4);
  }

  console.log(`[i18n-extract] uploading to ${apiBase}/api/ci/i18n/manifest`);
  try {
    const result = await uploadManifest({ apiBase, token, manifest });
    console.log('[i18n-extract] upload OK');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`[i18n-extract] ${err.message}`);
    exit(5);
  }
};

// Only run when invoked as a script (not when imported in tests). Compare
// the resolved path of argv[1] (what node was told to execute) against this
// module's path — works cross-platform without URL fiddling.
const invokedPath = argv[1] ? resolve(argv[1]) : null;
const selfPath = fileURLToPath(import.meta.url);
if (invokedPath && resolve(invokedPath) === selfPath) {
  main().catch((err) => {
    console.error(err);
    exit(1);
  });
}

// Export internals for unit testing and the fix-conflicts script.
export { buildManifest, extractFromSource, collectMatches };
