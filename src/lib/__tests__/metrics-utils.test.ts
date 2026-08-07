import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../utils';
import { parseRoiMultiplier, parseCapitalMillions, firstMoneyToken, firstPercent } from '../metrics';

describe('escapeHtml (M3 / injection guard)', () => {
  it('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
    expect(escapeHtml('a & b "quoted" \'single\'')).toBe(
      'a &amp; b &quot;quoted&quot; &#39;single&#39;'
    );
  });

  it('handles null/undefined/empty', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  it('leaves benign text unchanged', () => {
    expect(escapeHtml('ZBLAN Optical Fiber — $180B TAM')).toBe(
      'ZBLAN Optical Fiber — $180B TAM'
    );
  });
});

describe('parseRoiMultiplier', () => {
  it('parses Nx multipliers', () => {
    expect(parseRoiMultiplier('4.2x in 5 years')).toBe(4.2);
    expect(parseRoiMultiplier('3x')).toBe(3);
  });

  it('converts percentages to multiples', () => {
    expect(parseRoiMultiplier('220% over 5 years')).toBe(2.2);
  });

  it('returns null for unparseable text', () => {
    expect(parseRoiMultiplier('n/a')).toBeNull();
    expect(parseRoiMultiplier(null)).toBeNull();
  });
});

describe('parseCapitalMillions', () => {
  it('parses a single token', () => {
    expect(parseCapitalMillions('$45M for initial capacity')).toEqual({ min: 45, max: 45 });
  });

  it('parses a range and unit conversions', () => {
    expect(parseCapitalMillions('$10M–$50M for reseller entry')).toEqual({ min: 10, max: 50 });
    expect(parseCapitalMillions('$1.2B first node')).toEqual({ min: 1200, max: 1200 });
  });

  it('returns null when no money tokens are present', () => {
    expect(parseCapitalMillions('strong margins')).toBeNull();
  });
});

describe('firstMoneyToken / firstPercent', () => {
  it('extracts display tokens', () => {
    expect(firstMoneyToken('$45M for initial capacity')).toBe('$45M');
    expect(firstMoneyToken('$10M–$50M for reseller entry')).toMatch(/\$10M.*\$50M/);
    expect(firstPercent('45% CAGR over 5 years')).toBe('45%');
    expect(firstMoneyToken('none')).toBeNull();
  });
});
