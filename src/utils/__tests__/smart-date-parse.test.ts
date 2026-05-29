import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  applyPmHeuristic,
  formatParsed,
  normalizeChineseNumerals,
  normalizeCompactDate,
  parseKeyword,
  parseRelativeOffset,
  smartParse,
} from '../smart-date-parse';

const REF = dayjs('2026-05-20T10:30:00');

// ─── normalizeChineseNumerals ──────────────────────────────

describe('normalizeChineseNumerals', () => {
  // Isolated 十
  it('converts isolated 十 to 10', () => {
    expect(normalizeChineseNumerals('十')).toBe('10');
  });

  // 十 + digit
  it('converts 十二 to 12', () => {
    expect(normalizeChineseNumerals('十二')).toBe('12');
  });

  it('converts 十九 to 19', () => {
    expect(normalizeChineseNumerals('十九')).toBe('19');
  });

  // digit + 十
  it('converts 二十 to 20', () => {
    expect(normalizeChineseNumerals('二十')).toBe('20');
  });

  it('converts 三十 to 30', () => {
    expect(normalizeChineseNumerals('三十')).toBe('30');
  });

  // digit + 十 + digit
  it('converts 二十三 to 23', () => {
    expect(normalizeChineseNumerals('二十三')).toBe('23');
  });

  it('converts 十五 to 15', () => {
    expect(normalizeChineseNumerals('十五')).toBe('15');
  });

  // Single digits
  it('converts 三 to 3', () => {
    expect(normalizeChineseNumerals('三')).toBe('3');
  });

  it('converts 九 to 9', () => {
    expect(normalizeChineseNumerals('九')).toBe('9');
  });

  it('converts 零 to 0', () => {
    expect(normalizeChineseNumerals('零')).toBe('0');
  });

  it('converts 〇 to 0', () => {
    expect(normalizeChineseNumerals('〇')).toBe('0');
  });

  it('converts 两 to 2', () => {
    expect(normalizeChineseNumerals('两')).toBe('2');
  });

  // Weekday protection
  it('protects 五 after 周 while converting 三', () => {
    expect(normalizeChineseNumerals('下周五三点')).toBe('下周五3点');
  });

  it('protects 三 after 期 while converting second 三', () => {
    expect(normalizeChineseNumerals('星期三三点')).toBe('星期三3点');
  });

  // Mixed expressions
  it('converts 十五号下午三点 to 15号下午3点', () => {
    expect(normalizeChineseNumerals('十五号下午三点')).toBe('15号下午3点');
  });

  it('converts 二十三号 to 23号', () => {
    expect(normalizeChineseNumerals('二十三号')).toBe('23号');
  });

  // No change
  it('leaves ASCII dates unchanged', () => {
    expect(normalizeChineseNumerals('2025-06-01')).toBe('2025-06-01');
  });

  it('leaves plain ASCII text unchanged', () => {
    expect(normalizeChineseNumerals('hello')).toBe('hello');
  });
});

// ─── normalizeCompactDate ──────────────────────────────────

describe('normalizeCompactDate', () => {
  // Dashed short year
  it('expands 15-06-01 to 2015-06-01', () => {
    expect(normalizeCompactDate('15-06-01')).toBe('2015-06-01');
  });

  it('expands 01-12-25 to 2001-12-25', () => {
    expect(normalizeCompactDate('01-12-25')).toBe('2001-12-25');
  });

  it('expands 99-01-01 to 2099-01-01', () => {
    expect(normalizeCompactDate('99-01-01')).toBe('2099-01-01');
  });

  it('preserves time suffix with dashed short year', () => {
    expect(normalizeCompactDate('15-06-01 14:30')).toBe('2015-06-01 14:30');
  });

  // Pure-digit compact: YYMMDD (6 digits)
  it('expands 6-digit 250203 to 2025-02-03', () => {
    expect(normalizeCompactDate('250203')).toBe('2025-02-03');
  });

  it('expands 6-digit 010101 to 2001-01-01', () => {
    expect(normalizeCompactDate('010101')).toBe('2001-01-01');
  });

  // Pure-digit compact: YYYYMMDD (8 digits)
  it('expands 8-digit 20250203 to 2025-02-03', () => {
    expect(normalizeCompactDate('20250203')).toBe('2025-02-03');
  });

  // Pure-digit compact: YYMMDDHHmm (10 digits)
  it('expands 10-digit 2502031430 to 2025-02-03 14:30', () => {
    expect(normalizeCompactDate('2502031430')).toBe('2025-02-03 14:30');
  });

  // Pure-digit compact: YYYYMMDDHHmm (12 digits)
  it('expands 12-digit 202502031430 to 2025-02-03 14:30', () => {
    expect(normalizeCompactDate('202502031430')).toBe('2025-02-03 14:30');
  });

  // Pure-digit compact: YYYYMMDDHHmmss (14 digits)
  it('expands 14-digit 20250203143045 to 2025-02-03 14:30:45', () => {
    expect(normalizeCompactDate('20250203143045')).toBe('2025-02-03 14:30:45');
  });

  // No change
  it('leaves 4-digit dashed year unchanged', () => {
    expect(normalizeCompactDate('2025-06-01')).toBe('2025-06-01');
  });

  it('leaves non-matching text unchanged', () => {
    expect(normalizeCompactDate('abc')).toBe('abc');
  });

  it('leaves partial digits (5) unchanged', () => {
    expect(normalizeCompactDate('12345')).toBe('12345');
  });
});

// ─── parseRelativeOffset ───────────────────────────────────

describe('parseRelativeOffset', () => {
  it('parses +3d as 3 days forward', () => {
    const result = parseRelativeOffset('+3d', REF);
    expect(result).toBeDefined();
    expect(result?.format('YYYY-MM-DD')).toBe('2026-05-23');
  });

  it('parses -1w as 1 week backward', () => {
    const result = parseRelativeOffset('-1w', REF);
    expect(result).toBeDefined();
    expect(result?.format('YYYY-MM-DD')).toBe('2026-05-13');
  });

  it('parses +2h as 2 hours forward', () => {
    const result = parseRelativeOffset('+2h', REF);
    expect(result).toBeDefined();
    expect(result?.format('HH:mm')).toBe('12:30');
  });

  it('parses -30m as 30 minutes backward', () => {
    const result = parseRelativeOffset('-30m', REF);
    expect(result).toBeDefined();
    expect(result?.format('HH:mm')).toBe('10:00');
  });

  it('parses +1M as 1 month forward', () => {
    const result = parseRelativeOffset('+1M', REF);
    expect(result).toBeDefined();
    expect(result?.format('YYYY-MM-DD')).toBe('2026-06-20');
  });

  it('parses +1y as 1 year forward', () => {
    const result = parseRelativeOffset('+1y', REF);
    expect(result).toBeDefined();
    expect(result?.format('YYYY-MM-DD')).toBe('2027-05-20');
  });

  it('returns undefined for non-matching text', () => {
    expect(parseRelativeOffset('abc', REF)).toBeUndefined();
  });

  it('returns undefined for missing unit', () => {
    expect(parseRelativeOffset('+3', REF)).toBeUndefined();
  });

  it('returns undefined for missing sign', () => {
    expect(parseRelativeOffset('3d', REF)).toBeUndefined();
  });

  it('returns undefined for double sign', () => {
    expect(parseRelativeOffset('++3d', REF)).toBeUndefined();
  });

  it('returns undefined for whitespace-padded input', () => {
    expect(parseRelativeOffset('  +3d  ', REF)).toBeUndefined();
  });
});

// ─── parseKeyword ──────────────────────────────────────────

describe('parseKeyword', () => {
  it('returns today for "today"', () => {
    const result = parseKeyword('today');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs(), 'day')).toBe(true);
  });

  it('returns now for "now" (within tolerance)', () => {
    const before = dayjs();
    const result = parseKeyword('now');
    const after = dayjs();
    expect(result).toBeDefined();
    expect(result?.valueOf()).toBeGreaterThanOrEqual(before.valueOf());
    expect(result?.valueOf()).toBeLessThanOrEqual(after.valueOf());
  });

  it('returns tomorrow for "tomorrow"', () => {
    const result = parseKeyword('tomorrow');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
  });

  it('handles uppercase "TODAY" case-insensitively', () => {
    const result = parseKeyword('TODAY');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs(), 'day')).toBe(true);
  });

  it('returns now for 此刻', () => {
    const before = dayjs();
    const result = parseKeyword('此刻');
    const after = dayjs();
    expect(result).toBeDefined();
    expect(result?.valueOf()).toBeGreaterThanOrEqual(before.valueOf());
    expect(result?.valueOf()).toBeLessThanOrEqual(after.valueOf());
  });

  it('returns now for 现在', () => {
    const before = dayjs();
    const result = parseKeyword('现在');
    const after = dayjs();
    expect(result).toBeDefined();
    expect(result?.valueOf()).toBeGreaterThanOrEqual(before.valueOf());
    expect(result?.valueOf()).toBeLessThanOrEqual(after.valueOf());
  });

  it('returns yesterday for 昨天', () => {
    const result = parseKeyword('昨天');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
  });

  it('returns tomorrow for 明天', () => {
    const result = parseKeyword('明天');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
  });

  it('returns day after tomorrow for 后天', () => {
    const result = parseKeyword('后天');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().add(2, 'day'), 'day')).toBe(true);
  });

  it('returns day before yesterday for 前天', () => {
    const result = parseKeyword('前天');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().subtract(2, 'day'), 'day')).toBe(true);
  });

  it('returns next week for 下周', () => {
    const result = parseKeyword('下周');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().add(1, 'week'), 'day')).toBe(true);
  });

  it('returns last week for 上周', () => {
    const result = parseKeyword('上周');
    expect(result).toBeDefined();
    expect(result?.isSame(dayjs().subtract(1, 'week'), 'day')).toBe(true);
  });

  it('returns undefined for unknown keyword', () => {
    expect(parseKeyword('abc')).toBeUndefined();
  });
});

// ─── applyPmHeuristic ──────────────────────────────────────

describe('applyPmHeuristic', () => {
  it('returns undefined for undefined date', () => {
    expect(applyPmHeuristic(undefined, '三点')).toBeUndefined();
  });

  it('adjusts hour 3 to 15 for bare 三点 text', () => {
    const date = new Date(2026, 4, 20, 3, 0);
    const result = applyPmHeuristic(date, '三点');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(15);
  });

  it('does not adjust when 下午 is present', () => {
    const date = new Date(2026, 4, 20, 3, 0);
    const result = applyPmHeuristic(date, '下午三点');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(3);
  });

  it('does not adjust when hour is already PM (15)', () => {
    const date = new Date(2026, 4, 20, 15, 0);
    const result = applyPmHeuristic(date, '三点');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(15);
  });

  it('does not adjust when hour is 0', () => {
    const date = new Date(2026, 4, 20, 0, 0);
    const result = applyPmHeuristic(date, '三点');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(0);
  });

  it('does not adjust when hour is 12', () => {
    const date = new Date(2026, 4, 20, 12, 0);
    const result = applyPmHeuristic(date, '三点');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(12);
  });

  it('does not adjust when am marker is present', () => {
    const date = new Date(2026, 4, 20, 3, 0);
    const result = applyPmHeuristic(date, '3am');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(3);
  });

  it('does not adjust when 凌晨 is present', () => {
    const date = new Date(2026, 4, 20, 3, 0);
    const result = applyPmHeuristic(date, '凌晨三点');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(3);
  });

  it('does not adjust when no 点 pattern is present', () => {
    const date = new Date(2026, 4, 20, 3, 0);
    const result = applyPmHeuristic(date, '下周五');
    expect(result).toBeDefined();
    expect(result?.getHours()).toBe(3);
  });
});

// ─── smartParse ────────────────────────────────────────────

describe('smartParse', () => {
  // --- Strict format parsing (dayjs) ---
  describe('strict format parsing', () => {
    it('parses YYYY-MM-DD HH:mm with showTime=true', () => {
      const result = smartParse('2026-06-15 14:30', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 14:30');
    });

    it('parses YYYY-MM-DD with showTime=true (time defaults to 00:00)', () => {
      const result = smartParse('2026-06-15', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 00:00');
    });

    it('parses YYYY-MM-DD HH:mm:ss with showTime=true', () => {
      const result = smartParse('2026-06-15 14:30:45', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD HH:mm:ss')).toBe('2026-06-15 14:30:45');
    });

    it('parses YYYY-MM-DD with showTime=false', () => {
      const result = smartParse('2026-06-15', REF, false);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-06-15');
    });

    it('parses YYYY-MM-DD HH:mm as fallback with showTime=false', () => {
      const result = smartParse('2026-06-15 14:30', REF, false);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 14:30');
    });

    it('chrono rolls over invalid month 2026-13-01 to next year', () => {
      const result = smartParse('2026-13-01', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2027-01-01');
    });

    it('chrono rolls over invalid day 2026-06-32 to next month', () => {
      const result = smartParse('2026-06-32', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-07-02');
    });
  });

  // --- Two-digit year expansion ---
  describe('two-digit year expansion', () => {
    it('expands and parses 15-06-01 with showTime=false', () => {
      const result = smartParse('15-06-01', REF, false);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2015-06-01');
    });

    it('expands and parses 01-12-25 with showTime=false', () => {
      const result = smartParse('01-12-25', REF, false);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2001-12-25');
    });

    it('expands compact 6-digit 250203 to 2025-02-03', () => {
      const result = smartParse('250203', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2025-02-03');
    });

    it('expands compact 10-digit 2502031430 to 2025-02-03 14:30', () => {
      const result = smartParse('2502031430', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD HH:mm')).toBe('2025-02-03 14:30');
    });
  });

  // --- Relative offsets ---
  describe('relative offsets', () => {
    it('parses +3d', () => {
      const result = smartParse('+3d', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-23');
    });

    it('parses -1w', () => {
      const result = smartParse('-1w', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-13');
    });

    it('parses +2h', () => {
      const result = smartParse('+2h', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('HH:mm')).toBe('12:30');
    });
  });

  // --- Keywords ---
  describe('keywords', () => {
    it('parses today', () => {
      const result = smartParse('today', REF, true);
      expect(result).toBeDefined();
      expect(result?.isSame(dayjs(), 'day')).toBe(true);
    });

    it('parses 明天', () => {
      const result = smartParse('明天', REF, true);
      expect(result).toBeDefined();
      expect(result?.isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
    });

    it('parses 昨天', () => {
      const result = smartParse('昨天', REF, true);
      expect(result).toBeDefined();
      expect(result?.isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
    });
  });

  // --- Chrono-node (Chinese) ---
  describe('chrono-node (Chinese)', () => {
    it('parses 下周五下午3点', () => {
      const result = smartParse('下周五下午3点', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-29');
      expect(result?.hour()).toBe(15);
    });

    it('parses 明天下午3点', () => {
      const result = smartParse('明天下午3点', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-21');
      expect(result?.hour()).toBe(15);
    });

    it('parses 3天后', () => {
      const result = smartParse('3天后', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-23');
    });

    it('parses 下周五三点 with PM heuristic', () => {
      const result = smartParse('下周五三点', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-29');
      expect(result?.hour()).toBe(15);
    });

    it('parses 明天三点 with PM heuristic', () => {
      const result = smartParse('明天三点', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-21');
      expect(result?.hour()).toBe(15);
    });
  });

  // --- Chrono-node (English) ---
  describe('chrono-node (English)', () => {
    it('parses next friday 3pm', () => {
      const result = smartParse('next friday 3pm', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-29');
      expect(result?.hour()).toBe(15);
    });

    it('parses tomorrow via keyword before chrono', () => {
      const result = smartParse('tomorrow', REF, true);
      expect(result).toBeDefined();
      expect(result?.isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
    });

    it('parses in 3 days', () => {
      const result = smartParse('in 3 days', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-05-23');
    });
  });

  // --- Empty / invalid ---
  describe('empty and invalid input', () => {
    it('returns undefined for empty string', () => {
      expect(smartParse('', REF, true)).toBeUndefined();
    });

    it('returns undefined for whitespace-only string', () => {
      expect(smartParse('   ', REF, true)).toBeUndefined();
    });

    it('returns undefined for random text', () => {
      expect(smartParse('abcxyz', REF, true)).toBeUndefined();
    });

    it('returns undefined for hello world', () => {
      expect(smartParse('hello world', REF, true)).toBeUndefined();
    });
  });

  // --- Whitespace handling ---
  describe('whitespace handling', () => {
    it('trims and parses date with leading/trailing whitespace', () => {
      const result = smartParse('  2026-06-15  ', REF, true);
      expect(result).toBeDefined();
      expect(result?.format('YYYY-MM-DD')).toBe('2026-06-15');
    });
  });
});

// ─── formatParsed ──────────────────────────────────────────

describe('formatParsed', () => {
  it('formats with time (no seconds)', () => {
    const d = dayjs('2026-05-20 14:30:45');
    expect(formatParsed(d, true, false)).toBe('2026-05-20 14:30');
  });

  it('formats with time and seconds', () => {
    const d = dayjs('2026-05-20 14:30:45');
    expect(formatParsed(d, true, true)).toBe('2026-05-20 14:30:45');
  });

  it('formats date only', () => {
    const d = dayjs('2026-05-20 14:30:45');
    expect(formatParsed(d, false, false)).toBe('2026-05-20');
  });
});
