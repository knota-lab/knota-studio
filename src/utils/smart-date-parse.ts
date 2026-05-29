import * as chrono from 'chrono-node';
import dayjs from 'dayjs';

// ─── Format constants ──────────────────────────────────

const formatWithTime = 'YYYY-MM-DD HH:mm';
const formatDateOnly = 'YYYY-MM-DD';
const formatWithSeconds = 'YYYY-MM-DD HH:mm:ss';

// ─── Relative offset unit map ──────────────────────────

const offsetUnitMap: Record<string, dayjs.ManipulateType> = {
  d: 'day',
  w: 'week',
  h: 'hour',
  m: 'minute',
  M: 'month',
  y: 'year',
};

// ─── Keyword map for shortcuts ─────────────────────────

const keywordMap: Record<string, () => dayjs.Dayjs> = {
  today: () => dayjs(),
  now: () => dayjs(),
  tomorrow: () => dayjs().add(1, 'day'),
  此刻: () => dayjs(),
  现在: () => dayjs(),
  昨天: () => dayjs().subtract(1, 'day'),
  明天: () => dayjs().add(1, 'day'),
  后天: () => dayjs().add(2, 'day'),
  前天: () => dayjs().subtract(2, 'day'),
  下周: () => dayjs().add(1, 'week'),
  上周: () => dayjs().subtract(1, 'week'),
};

// ─── Chrono instance: zh (primary) + en (fallback) ─────

const bilingualChrono = new chrono.Chrono(chrono.zh.casual);
chrono.casual.parsers.forEach((p) => {
  bilingualChrono.parsers.push(p);
});

// ─── Chinese numeral normalization ─────────────────────

const chineseDigitMap: Record<string, string> = {
  零: '0',
  〇: '0',
  一: '1',
  二: '2',
  两: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
};

function normalizeChineseNumerals(text: string): string {
  let result = text.replace(
    /(?<![一二两三四五六七八九零〇])十(?![一二两三四五六七八九零〇])/g,
    '10',
  );
  result = result.replace(
    /([一二两三四五六七八九零〇])十(?![一二两三四五六七八九零〇])/g,
    (_, d) => `${chineseDigitMap[d]}0`,
  );
  result = result.replace(
    /([一二两三四五六七八九零〇])十([一二两三四五六七八九零〇])/g,
    (_, d1, d2) => `${chineseDigitMap[d1]}${chineseDigitMap[d2]}`,
  );
  result = result.replace(
    /十([一二两三四五六七八九零〇])/g,
    (_, d) => `1${chineseDigitMap[d]}`,
  );
  result = result.replace(
    /(?<!周|期|拜)[一二两三四五六七八九零〇]/g,
    (ch) => chineseDigitMap[ch] ?? ch,
  );
  return result;
}

// ─── AM/PM heuristic for Chinese ───────────────────────

const amPmPattern = /上午|下午|早上|晚上|凌晨|中午|傍晚|am|pm|a\.m\.|p\.m\./i;
const hourOnlyPattern = /(\d{1,2})点/;

function applyPmHeuristic(
  chronoDate: Date | undefined,
  originalText: string,
): Date | undefined {
  if (!chronoDate) return undefined;
  if (amPmPattern.test(originalText)) return chronoDate;
  const normalizedText = normalizeChineseNumerals(originalText);
  if (!hourOnlyPattern.test(normalizedText)) return chronoDate;
  const hour = chronoDate.getHours();
  if (hour >= 1 && hour <= 11) {
    const adjusted = new Date(chronoDate);
    adjusted.setHours(hour + 12);
    return adjusted;
  }
  return chronoDate;
}

// ─── Compact & short year normalization ─────────────────
// Handles: "250203" → "2025-02-03", "25-02-03" → "2025-02-03",
//          "2502031430" → "2025-02-03 14:30", "20250203" → "2025-02-03", etc.

function normalizeCompactDate(text: string): string {
  // Dashed short year: "25-02-03" → "2025-02-03"
  const dashedShortYear = text.match(
    /^(\d{2})(-\d{2}-\d{2})((?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/,
  );
  if (dashedShortYear) {
    const fullYear = 2000 + Number.parseInt(dashedShortYear[1], 10);
    return `${fullYear}${dashedShortYear[2]}${dashedShortYear[3]}`;
  }

  // Pure-digit compact formats (no separators)
  const pureDigits = text.match(/^(\d+)$/);
  if (!pureDigits) return text;

  const digits = pureDigits[1];
  const len = digits.length;

  // 6 digits: YYMMDD → 20YY-MM-DD
  if (len === 6) {
    const yy = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const dd = digits.slice(4, 6);
    return `${2000 + Number.parseInt(yy, 10)}-${mm}-${dd}`;
  }

  // 8 digits: YYYYMMDD → YYYY-MM-DD
  if (len === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  // 10 digits: YYMMDDHHmm → 20YY-MM-DD HH:mm
  if (len === 10) {
    const yy = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const dd = digits.slice(4, 6);
    const hh = digits.slice(6, 8);
    const mi = digits.slice(8, 10);
    return `${2000 + Number.parseInt(yy, 10)}-${mm}-${dd} ${hh}:${mi}`;
  }

  // 12 digits: YYYYMMDDHHmm → YYYY-MM-DD HH:mm
  if (len === 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
  }

  // 14 digits: YYYYMMDDHHmmss → YYYY-MM-DD HH:mm:ss
  if (len === 14) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}`;
  }

  return text;
}

// ─── Parse helpers ─────────────────────────────────────

function parseRelativeOffset(
  text: string,
  ref: dayjs.Dayjs,
): dayjs.Dayjs | undefined {
  const match = text.match(/^([+-])(\d+)([dwhmMy])$/);
  if (!match) return undefined;
  const sign = match[1] === '+' ? 1 : -1;
  const amount = Number.parseInt(match[2], 10);
  const unit = offsetUnitMap[match[3]];
  if (!unit || Number.isNaN(amount)) return undefined;
  return ref.add(sign * amount, unit);
}

function parseKeyword(text: string): dayjs.Dayjs | undefined {
  const fn = keywordMap[text.toLowerCase()];
  return fn ? fn() : undefined;
}

function parseWithChrono(text: string, ref: Date): Date | undefined {
  const normalized = normalizeChineseNumerals(text);
  const results = bilingualChrono.parse(normalized, ref, { forwardDate: true });
  if (results.length > 0) {
    const rawDate = results[0].start.date();
    return applyPmHeuristic(rawDate, text);
  }
  return undefined;
}

function smartParse(
  text: string,
  ref: dayjs.Dayjs,
  showTime: boolean,
): dayjs.Dayjs | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const expanded = normalizeCompactDate(trimmed);
  const formats = showTime
    ? [formatWithSeconds, formatWithTime, formatDateOnly]
    : [formatDateOnly, formatWithTime];
  const strictParsed = dayjs(expanded, formats, true);
  if (strictParsed.isValid()) return strictParsed;

  const relResult = parseRelativeOffset(trimmed, ref);
  if (relResult) return relResult;

  const kwResult = parseKeyword(trimmed);
  if (kwResult) return kwResult;

  const chronoResult = parseWithChrono(trimmed, ref.toDate());
  if (chronoResult) {
    const d = dayjs(chronoResult);
    if (d.isValid()) return d;
  }

  return undefined;
}

function formatParsed(
  d: dayjs.Dayjs,
  showTime: boolean,
  showSeconds: boolean,
): string {
  if (showSeconds && showTime) return d.format(formatWithSeconds);
  if (showTime) return d.format(formatWithTime);
  return d.format(formatDateOnly);
}

export {
  applyPmHeuristic,
  formatParsed,
  formatWithTime,
  normalizeChineseNumerals,
  normalizeCompactDate,
  parseKeyword,
  parseRelativeOffset,
  parseWithChrono,
  smartParse,
};
