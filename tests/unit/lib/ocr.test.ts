/**
 * Tests for OCR module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pdf-parse
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

describe('OCR Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('detectScannedPDF', () => {
    it('detects text-based PDF as not scanned', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: 'A'.repeat(3000), // 3000 chars
        numpages: 1,
      });

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.pageCount).toBe(1);
      expect(result.textLength).toBe(3000);
    });

    it('detects scanned PDF with little text', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: 'Metadata only', // ~12 chars
        numpages: 1,
      });

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('calculates confidence correctly for borderline cases', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: 'A'.repeat(50), // 50 chars per page
        numpages: 1,
      });

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(true);
      expect(result.confidence).toBe(0.5); // (100 - 50) / 100
    });

    it('handles multi-page PDFs', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: 'A'.repeat(6000), // 6000 chars total, 2000 per page
        numpages: 3,
      });

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(false);
      expect(result.pageCount).toBe(3);
    });

    it('handles parsing errors gracefully', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockRejectedValue(new Error('Invalid PDF'));

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('invalid');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.pageCount).toBe(0);
    });

    it('handles empty PDF text', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: '',
        numpages: 1,
      });

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(true);
      expect(result.confidence).toBe(1); // 100% confident it's scanned
    });

    it('handles whitespace-only text', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: '   \n\t   ',
        numpages: 1,
      });

      const { detectScannedPDF } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await detectScannedPDF(buffer);

      expect(result.isScanned).toBe(true);
      expect(result.textLength).toBe(0);
    });
  });

  describe('extractTextWithOCR', () => {
    it('extracts text from regular PDF', async () => {
      vi.resetModules();
      const pdfParse = (await import('pdf-parse')).default;
      // Need at least 100 chars per page to not be considered scanned
      const longText = 'This is a contract with terms and conditions. '.repeat(10);
      (pdfParse as any).mockResolvedValue({
        text: longText,
        numpages: 1,
      });

      const { extractTextWithOCR } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await extractTextWithOCR(buffer);

      expect(result.usedOCR).toBe(false);
      expect(result.text).toContain('contract');
      expect(result.pageCount).toBe(1);
    });

    it('attempts OCR for scanned PDF', async () => {
      vi.resetModules();
      const pdfParse = (await import('pdf-parse')).default;
      (pdfParse as any).mockResolvedValue({
        text: '', // No text - scanned
        numpages: 2,
      });

      const { extractTextWithOCR } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      const result = await extractTextWithOCR(buffer);

      expect(result.usedOCR).toBe(true);
      expect(result.text).toContain('scanned image');
      expect(result.confidence).toBe(0); // Placeholder returns 0 confidence
      expect(result.pageCount).toBe(2);
    });

    it('throws on parsing failure for regular PDF', async () => {
      vi.resetModules();
      const pdfParse = (await import('pdf-parse')).default;
      const longText = 'This is a contract with terms and conditions. '.repeat(10);

      // First call for detection - has text so it's not scanned
      (pdfParse as any).mockResolvedValueOnce({
        text: longText,
        numpages: 1,
      });

      // Second call for extraction - fails
      (pdfParse as any).mockRejectedValueOnce(new Error('Parse error'));

      const { extractTextWithOCR } = await import('@/lib/ocr');
      const buffer = Buffer.from('test');

      await expect(extractTextWithOCR(buffer)).rejects.toThrow('Failed to parse PDF document');
    });
  });

  describe('isOCRAvailable', () => {
    it('returns true (placeholder implementation)', async () => {
      const { isOCRAvailable } = await import('@/lib/ocr');

      expect(isOCRAvailable()).toBe(true);
    });
  });
});

describe('OCR Result Types', () => {
  it('has correct interface structure', async () => {
    const pdfParse = (await import('pdf-parse')).default;
    (pdfParse as any).mockResolvedValue({
      text: 'Test text',
      numpages: 1,
    });

    const { extractTextWithOCR } = await import('@/lib/ocr');
    const buffer = Buffer.from('test');

    const result = await extractTextWithOCR(buffer);

    // Type checking
    expect(typeof result.text).toBe('string');
    expect(typeof result.usedOCR).toBe('boolean');
    expect(result.pageCount).toBeDefined();
  });
});
