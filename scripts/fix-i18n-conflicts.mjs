#!/usr/bin/env node
/**
 * i18n source-text conflict fixer.
 *
 * Companion to `extract-i18n.mjs`. Finds every `(namespace, key)` whose
 * `t('Ns.key', '中文')` calls disagree on the second-arg literal across
 * the codebase, then either reports them, auto-rewrites by majority vote,
 * or walks the developer through one prompt per conflict.
 *
 * Why a separate script? `extract-i18n.mjs` is read-only and runs in CI.
 * Conflict resolution rewrites source files — a destructive op that has no
 * business sharing a process with the upload path.
 *
 * Usage:
 *   pnpm run i18n:fix-conflicts -- --report
 *     Print the conflict table and exit. Read-only.
 *
 *   pnpm run i18n:fix-conflicts -- --auto-majority
 *     Pick the variant with the most call sites for each conflicting
 *     `(ns, key)` (ties broken by first-seen, matching `buildManifest`'s
 *     winner). Dry-run by default; print the diff summary and exit.
 *
 *   pnpm run i18n:fix-conflicts -- --auto-majority --write
 *     Same as above, but rewrite the source files in place.
 *
 *   pnpm run i18n:fix-conflicts -- --interactive
 *     Walk through each conflict; arrow-key select the winner per key
 *     (or skip). Dry-run unless `--write` is also passed.
 *
 *   pnpm run i18n:fix-conflicts -- --src <dir>     # default: src
 *
 * Rewrite mechanics: each call site recorded by the extractor carries
 * `filePath` + `line`. We re-run the same `T_CALL_RE` against that single
 * line, find the `t()` whose key matches, and replace the second-arg
 * string literal in place. Quote style of the original literal is
 * preserved; the new value is escaped against that quote.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { confirm, select } from '@inquirer/prompts';

import { buildManifest, collectMatches } from './extract-i18n.mjs';

// Same regex as the extractor, but used per-line for surgical rewrites.
// Keep in sync with extract-i18n.mjs.
const T_CALL_RE_GLOBAL =
  /\bt\(\s*(['"])((?:\\.|(?!\1).)+)\1(?:\s*,\s*(['"])((?:\\.|(?!\3).)*)\3)?/g;

// ── Argv parsing ────────────────────────────────────────────────────────────

const FLAGS = new Set([
  '--report',
  '--auto-majority',
  '--interactive',
  '--write',
  '--help',
  '-h',
]);
const OPTIONS = new Set(['--src']);

const parseArgs = (raw) => {
  const opts = {
    mode: null, // 'report' | 'auto' | 'interactive'
    write: false,
    src: 'src',
    help: false,
  };
  for (let i = 2; i < raw.length; i++) {
    const a = raw[i];
    if (a === '--report') opts.mode = setMode(opts.mode, 'report');
    else if (a === '--auto-majority') opts.mode = setMode(opts.mode, 'auto');
    else if (a === '--interactive')
      opts.mode = setMode(opts.mode, 'interactive');
    else if (a === '--write') opts.write = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (OPTIONS.has(a)) {
      const v = raw[++i];
      if (!v || v.startsWith('--')) {
        throw new Error(`Missing value for ${a}`);
      }
      if (a === '--src') opts.src = v;
    } else if (!FLAGS.has(a)) {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
};

const setMode = (current, next) => {
  if (current && current !== next) {
    throw new Error(`Conflicting modes: --${current} and --${next}`);
  }
  return next;
};

const printHelp = () => {
  console.log(`Usage: pnpm run i18n:fix-conflicts -- <mode> [--write] [--src <dir>]

Modes (pick one):
  --report           List conflicts; do nothing else
  --auto-majority    Pick the variant with the most call sites
  --interactive      Prompt once per conflict (arrow keys to select)

Other:
  --write            Apply rewrites in place (auto/interactive only;
                     omit for dry-run)
  --src <dir>        Source root (default: src)
  -h, --help         Show this help`);
};

// ── Conflict resolution ─────────────────────────────────────────────────────

/**
 * Pick the variant with the most call sites. Ties go to the first-seen
 * variant — same rule `buildManifest` uses for the upload winner, so
 * "auto" defaults match the manifest's current behaviour rather than
 * surprising the developer with a different choice.
 */
const pickMajority = (conflict) => {
  // candidates is already sorted by location count desc; first wins.
  // For ties on count, prefer the current winner (already at the front
  // of the list when its count matches, by iteration order).
  const top = conflict.candidates[0];
  // Detect a true tie at position 0 → fall back to the manifest winner
  // for determinism.
  const tie =
    conflict.candidates.length > 1 &&
    conflict.candidates[1].locations.length === top.locations.length;
  return tie ? conflict.winner : top.sourceText;
};

/**
 * Rewrite `source` so the `t()` call at `targetLine` whose key matches
 * `ns.key` carries `chosen` as its 2nd-arg literal. Returns the new
 * source + a snippet pair, or null if no matching call is found at that
 * line.
 *
 * The extractor records `line` as the line of the `t(` opening — but the
 * full call may span multiple lines:
 *
 *   message: t(
 *     'Common.validation.max4096',
 *     '最大 4096 字符',
 *   ),
 *
 * So we run T_CALL_RE against the WHOLE file (which is what the extractor
 * does too) and pick the match whose start offset falls on `targetLine`.
 * That handles single-line, multi-line, and same-line-multi-`t()` cases
 * uniformly.
 */
const rewriteSource = (source, targetLine, ns, key, chosen) => {
  // Precompute line-start offsets so we can map regex match index → line.
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10 /* \n */) lineStarts.push(i + 1);
  }
  const offsetToLine = (offset) => {
    // Binary search for the largest lineStart ≤ offset.
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1; // 1-based
  };

  T_CALL_RE_GLOBAL.lastIndex = 0;
  let m;
  while ((m = T_CALL_RE_GLOBAL.exec(source)) !== null) {
    const startLine = offsetToLine(m.index);
    if (startLine !== targetLine) continue;
    const literal = m[2];
    if (literal.includes('\\')) continue;
    const dot = literal.indexOf('.');
    if (dot <= 0 || dot === literal.length - 1) continue;
    if (literal.slice(0, dot) !== ns) continue;
    if (literal.slice(dot + 1) !== key) continue;

    if (m[3] !== undefined) {
      // Has 2nd-arg literal → replace its inner contents, preserve quote.
      const quote = m[3];
      const escaped = escapeForQuote(chosen, quote);
      // Inner literal sits at: end of m[0] - 1 (close quote) - m[4].length
      const innerEnd = m.index + m[0].length - 1;
      const innerStart = innerEnd - m[4].length;
      const newSource =
        source.slice(0, innerStart) + escaped + source.slice(innerEnd);
      return {
        source: newSource,
        before: extractCallSnippet(source, m.index, m[0].length),
        after: extractCallSnippet(
          newSource,
          m.index,
          m[0].length + (escaped.length - m[4].length),
        ),
      };
    }
    // Single-arg call → inject `, '<chosen>'` before the closing paren.
    // Default to single quotes (matches our codebase convention).
    const quote = "'";
    const escaped = escapeForQuote(chosen, quote);
    const insertion = `, ${quote}${escaped}${quote}`;
    const insertAt = m.index + m[0].length;
    const newSource =
      source.slice(0, insertAt) + insertion + source.slice(insertAt);
    return {
      source: newSource,
      before: extractCallSnippet(source, m.index, m[0].length),
      after: extractCallSnippet(
        newSource,
        m.index,
        m[0].length + insertion.length,
      ),
    };
  }
  return null;
};

/**
 * Pull a one-line-ish snippet around a call match for diff display.
 * For multi-line calls, collapses inner whitespace so the diff stays
 * scannable in the terminal.
 */
const extractCallSnippet = (source, start, length) => {
  const slice = source.slice(start, start + length);
  return slice.replace(/\s+/g, ' ').trim();
};

/**
 * Escape `value` so it is safe inside `quote`-quoted JS string literal.
 * Handles backslash, the quote itself, newline, CR, tab — same set the
 * extractor's unescape handles, kept symmetric.
 */
const escapeForQuote = (value, quote) => {
  let out = '';
  for (const ch of value) {
    if (ch === '\\') out += '\\\\';
    else if (ch === quote) out += `\\${quote}`;
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else out += ch;
  }
  return out;
};

// ── Apply decisions ─────────────────────────────────────────────────────────

/**
 * Apply a set of `{ namespace, key, chosen }` decisions. Groups edits by
 * file so each file is read+written once. Returns a per-file diff summary
 * and the count of unmatched sites (extractor said the call was at
 * file:line but rewriteLine couldn't find it).
 */
const applyDecisions = async (decisions, conflicts, opts) => {
  // Build: filePath → [{ line, ns, key, chosen, oldText }]
  const fileEdits = new Map();
  for (const d of decisions) {
    const conflict = conflicts.find(
      (c) => c.namespace === d.namespace && c.key === d.key,
    );
    if (!conflict) continue;
    for (const cand of conflict.candidates) {
      // Only rewrite call sites whose current text DIFFERS from the chosen
      // text — leave already-correct sites alone for a cleaner diff.
      if (cand.sourceText === d.chosen) continue;
      for (const loc of cand.locations) {
        let edits = fileEdits.get(loc.filePath);
        if (!edits) {
          edits = [];
          fileEdits.set(loc.filePath, edits);
        }
        edits.push({
          line: loc.line,
          namespace: d.namespace,
          key: d.key,
          chosen: d.chosen,
          oldText: cand.sourceText,
        });
      }
    }
  }

  const summary = []; // { filePath, changed, missed, snippets: [{ line, ns, key, before, after }] }
  let totalChanged = 0;
  let totalMissed = 0;

  for (const [filePath, edits] of fileEdits) {
    const absPath = resolve(cwd(), filePath);
    const original = await readFile(absPath, 'utf8');
    let current = original;
    const snippets = [];
    let changed = 0;
    let missed = 0;

    // Sort by line desc so each rewrite happens in a still-untouched
    // suffix of the buffer — earlier-line offsets stay valid even though
    // the replacement may shift later content.
    edits.sort((a, b) => b.line - a.line);

    for (const e of edits) {
      const result = rewriteSource(
        current,
        e.line,
        e.namespace,
        e.key,
        e.chosen,
      );
      if (result === null) {
        missed++;
        continue;
      }
      current = result.source;
      snippets.push({
        line: e.line,
        ns: e.namespace,
        key: e.key,
        before: result.before,
        after: result.after,
      });
      changed++;
    }

    // Sort snippets by line asc for nicer terminal output.
    snippets.sort((a, b) => a.line - b.line);

    if (opts.write && changed > 0 && current !== original) {
      await writeFile(absPath, current, 'utf8');
    }

    summary.push({ filePath, changed, missed, snippets });
    totalChanged += changed;
    totalMissed += missed;
  }

  return { summary, totalChanged, totalMissed };
};

// ── Output formatters ───────────────────────────────────────────────────────

const formatConflictTable = (conflicts) => {
  const lines = [];
  lines.push(
    `Found ${conflicts.length} key(s) with inconsistent sourceText:\n`,
  );
  for (const c of conflicts) {
    const total = c.candidates.reduce((n, v) => n + v.locations.length, 0);
    lines.push(`• ${c.namespace}.${c.key}  (${total} call sites)`);
    for (const v of c.candidates) {
      const head = v.sourceText === c.winner ? '★' : ' ';
      lines.push(`    ${head} "${v.sourceText}"  ×${v.locations.length}`);
      for (const l of v.locations.slice(0, 3)) {
        lines.push(`         ${l.filePath}:${l.line}`);
      }
      if (v.locations.length > 3) {
        lines.push(`         …and ${v.locations.length - 3} more`);
      }
    }
    lines.push('');
  }
  lines.push('★ = current manifest winner (first non-empty seen)');
  return lines.join('\n');
};

const formatDiffSummary = ({ summary, totalChanged, totalMissed }, write) => {
  const lines = [];
  lines.push(
    `${write ? 'Rewrote' : 'Would rewrite'} ${totalChanged} call site(s) across ${summary.filter((f) => f.changed > 0).length} file(s)${totalMissed > 0 ? `; ${totalMissed} miss(es) — see below` : ''}.\n`,
  );
  for (const f of summary) {
    if (f.changed === 0 && f.missed === 0) continue;
    lines.push(
      `◆ ${f.filePath}  (${f.changed} change(s), ${f.missed} miss(es))`,
    );
    for (const s of f.snippets) {
      lines.push(`    L${s.line}  ${s.ns}.${s.key}`);
      lines.push(`      - ${s.before}`);
      lines.push(`      + ${s.after}`);
    }
    lines.push('');
  }
  if (totalMissed > 0) {
    lines.push(
      'Misses: extractor data was stale (line moved) or the call could not be matched. ' +
        'Re-run extract-i18n.mjs and try again, or fix those sites by hand.',
    );
  }
  return lines.join('\n');
};

// ── Modes ───────────────────────────────────────────────────────────────────

const runReport = (conflicts) => {
  if (conflicts.length === 0) {
    console.log('No conflicts. Nothing to report.');
    return;
  }
  console.log(formatConflictTable(conflicts));
};

const runAutoMajority = async (conflicts, opts) => {
  if (conflicts.length === 0) {
    console.log('No conflicts. Nothing to do.');
    return;
  }
  const decisions = conflicts.map((c) => ({
    namespace: c.namespace,
    key: c.key,
    chosen: pickMajority(c),
  }));
  const result = await applyDecisions(decisions, conflicts, opts);
  console.log(formatDiffSummary(result, opts.write));
  if (!opts.write) {
    console.log(
      '(dry-run) re-run with --write to apply. The diff above is what will land.',
    );
  } else {
    console.log('Done. Run `pnpm exec biome format --write src` if needed.');
  }
};

const runInteractive = async (conflicts, opts) => {
  if (conflicts.length === 0) {
    console.log('No conflicts. Nothing to do.');
    return;
  }
  console.log(
    `Walking ${conflicts.length} conflict(s). Pick a winner per key (or "skip").`,
  );
  const decisions = [];
  for (let i = 0; i < conflicts.length; i++) {
    const c = conflicts[i];
    const total = c.candidates.reduce((n, v) => n + v.locations.length, 0);
    const choices = c.candidates.map((v) => ({
      name: `"${v.sourceText}"  ×${v.locations.length}${v.sourceText === c.winner ? '  ★' : ''}`,
      value: v.sourceText,
      description: v.locations
        .slice(0, 5)
        .map((l) => `${l.filePath}:${l.line}`)
        .join('\n'),
    }));
    choices.push({
      name: '— skip this key —',
      value: '__SKIP__',
      description: 'Leave all call sites untouched',
    });
    let chosen;
    try {
      chosen = await select({
        message: `[${i + 1}/${conflicts.length}] ${c.namespace}.${c.key}  (${total} sites)`,
        choices,
        default: c.winner,
      });
    } catch (err) {
      // ExitPromptError on Ctrl+C — bail cleanly without writing anything.
      if (err?.name === 'ExitPromptError') {
        console.log('\nAborted. No files written.');
        return;
      }
      throw err;
    }
    if (chosen !== '__SKIP__') {
      decisions.push({ namespace: c.namespace, key: c.key, chosen });
    }
  }
  if (decisions.length === 0) {
    console.log('All keys skipped. Nothing to do.');
    return;
  }
  if (!opts.write) {
    const result = await applyDecisions(decisions, conflicts, opts);
    console.log(formatDiffSummary(result, false));
    console.log(
      '(dry-run) re-run with --write to apply. The diff above is what will land.',
    );
    return;
  }
  // Final confirmation before writing.
  let proceed;
  try {
    proceed = await confirm({
      message: `Apply ${decisions.length} decision(s) to source files?`,
      default: true,
    });
  } catch (err) {
    if (err?.name === 'ExitPromptError') {
      console.log('\nAborted. No files written.');
      return;
    }
    throw err;
  }
  if (!proceed) {
    console.log('Aborted. No files written.');
    return;
  }
  const result = await applyDecisions(decisions, conflicts, opts);
  console.log(formatDiffSummary(result, true));
  console.log('Done. Run `pnpm exec biome format --write src` if needed.');
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
  if (opts.help || !opts.mode) {
    printHelp();
    return;
  }

  const root = cwd();
  const srcDir = resolve(root, opts.src);
  console.log(`[i18n-fix] scanning ${opts.src}`);
  const { allMatches } = await collectMatches(srcDir, root);
  const { conflicts } = buildManifest(allMatches);
  console.log(
    `[i18n-fix] ${allMatches.length} call sites, ${conflicts.length} conflict(s)`,
  );

  if (opts.mode === 'report') runReport(conflicts);
  else if (opts.mode === 'auto') await runAutoMajority(conflicts, opts);
  else if (opts.mode === 'interactive') await runInteractive(conflicts, opts);
};

const invokedPath = argv[1] ? resolve(argv[1]) : null;
const selfPath = fileURLToPath(import.meta.url);
if (invokedPath && resolve(invokedPath) === selfPath) {
  main().catch((err) => {
    console.error(err);
    exit(1);
  });
}
