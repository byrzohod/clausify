import { describe, it, expect, vi } from 'vitest';
import { parseDocx } from '@/lib/parsers/docx';
import { ParseError } from '@/lib/parsers/pdf';

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

import mammoth from 'mammoth';

describe('DOCX Parser', () => {
  it('extracts text from valid DOCX', async () => {
    const mockResult = {
      value: 'This is a sample contract agreement.',
      messages: [],
    };

    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce(mockResult);

    const result = await parseDocx(Buffer.from('fake-docx-content'));

    expect(result.text).toContain('sample contract agreement');
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('handles empty DOCX gracefully', async () => {
    const mockResult = {
      value: '',
      messages: [],
    };

    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce(mockResult);

    const result = await parseDocx(Buffer.from('empty-docx'));

    expect(result.text).toBe('');
    expect(result.pageCount).toBe(1);
  });

  it('throws ParseError for invalid DOCX', async () => {
    vi.mocked(mammoth.extractRawText).mockRejectedValueOnce(
      new Error('Invalid DOCX')
    );

    await expect(parseDocx(Buffer.from('invalid'))).rejects.toThrow(ParseError);
  });

  it('estimates page count based on text length', async () => {
    // Create a long text (more than 3000 characters)
    const longText = 'A'.repeat(9000);
    const mockResult = {
      value: longText,
      messages: [],
    };

    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce(mockResult);

    const result = await parseDocx(Buffer.from('long-docx'));

    expect(result.pageCount).toBe(3); // 9000 / 3000 = 3 pages
  });

  it('cleans up whitespace in extracted text', async () => {
    const mockResult = {
      value: 'This    has   lots   of    spaces',
      messages: [],
    };

    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce(mockResult);

    const result = await parseDocx(Buffer.from('messy-docx'));

    expect(result.text).not.toContain('    ');
    expect(result.text).toMatch(/This has lots of spaces/);
  });
});
