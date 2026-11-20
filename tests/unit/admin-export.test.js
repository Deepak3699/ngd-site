import { describe, expect, it } from 'vitest';
import { csvCell } from '../../server/api/admin/export.js';

describe('csvCell (CSV export)', () => {
  it('returns empty for null/undefined', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('passes through plain values and collapses newlines', () => {
    expect(csvCell('hello world')).toBe('hello world');
    expect(csvCell('line1\nline2')).toBe('line1 line2');
    expect(csvCell(12345)).toBe('12345');
  });

  it('quotes values containing delimiters and escapes quotes', () => {
    expect(csvCell('has, comma')).toBe('"has, comma"');
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('neutralises spreadsheet formulas (=, +, -, @) with a leading apostrophe', () => {
    expect(csvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(csvCell('+cmd')).toBe("'+cmd");
    expect(csvCell('-x')).toBe("'-x");
    expect(csvCell('@mention')).toBe("'@mention");
    expect(csvCell('normal')).toBe('normal');
  });
});
