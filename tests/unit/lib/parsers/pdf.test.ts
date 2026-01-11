import { describe, it, expect, vi } from 'vitest';
import { parsePdf, ParseError } from '@/lib/parsers/pdf';

// Mock pdf-parse
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

import pdf from 'pdf-parse';

describe('PDF Parser', () => {
  it('extracts text from valid PDF', async () => {
    const mockPdfData = {
      text: 'This is a sample contract agreement.',
      numpages: 2,
      info: {
        Title: 'Sample Contract',
        Author: 'Test Author',
        CreationDate: '2024-01-01',
      },
    };

    vi.mocked(pdf).mockResolvedValueOnce(mockPdfData);

    const result = await parsePdf(Buffer.from('fake-pdf-content'));

    expect(result.text).toContain('sample contract agreement');
    expect(result.pageCount).toBe(2);
    expect(result.metadata?.title).toBe('Sample Contract');
    expect(result.metadata?.author).toBe('Test Author');
  });

  it('handles empty PDF gracefully', async () => {
    const mockPdfData = {
      text: '',
      numpages: 1,
      info: {},
    };

    vi.mocked(pdf).mockResolvedValueOnce(mockPdfData);

    const result = await parsePdf(Buffer.from('empty-pdf'));

    expect(result.text).toBe('');
    expect(result.pageCount).toBe(1);
  });

  it('throws ParseError for invalid PDF', async () => {
    vi.mocked(pdf).mockRejectedValueOnce(new Error('Invalid PDF'));

    await expect(parsePdf(Buffer.from('invalid'))).rejects.toThrow(ParseError);
  });

  it('cleans up whitespace in extracted text', async () => {
    const mockPdfData = {
      text: 'This    has   lots   of    spaces\n\n\nand newlines',
      numpages: 1,
      info: {},
    };

    vi.mocked(pdf).mockResolvedValueOnce(mockPdfData);

    const result = await parsePdf(Buffer.from('messy-pdf'));

    expect(result.text).not.toContain('    ');
    expect(result.text).toMatch(/This has lots of spaces/);
  });

  it('removes page number patterns', async () => {
    const mockPdfData = {
      text: 'Contract terms Page 1 of 10 more content',
      numpages: 10,
      info: {},
    };

    vi.mocked(pdf).mockResolvedValueOnce(mockPdfData);

    const result = await parsePdf(Buffer.from('pdf-with-pages'));

    expect(result.text).not.toContain('Page 1 of 10');
  });
});
