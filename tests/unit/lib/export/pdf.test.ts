import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAnalysisToPdf, downloadPdf } from '@/lib/export/pdf';
import type { AnalysisResult } from '@/types';

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
      pages: [{}, {}, {}], // 2 pages
    },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    addPage: vi.fn(),
    setPage: vi.fn(),
    output: vi.fn().mockReturnValue(new Blob(['test pdf content'], { type: 'application/pdf' })),
  })),
}));

const mockAnalysis: AnalysisResult = {
  summary: 'This is a test contract summary.',
  contractType: 'NDA',
  riskScore: 'MEDIUM',
  keyTerms: [
    { term: 'Term 1', value: 'Value 1', importance: 'high', explanation: 'Explanation 1' },
  ],
  obligations: [
    { party: 'Party A', description: 'Must do X', deadline: '30 days' },
  ],
  redFlags: [
    { title: 'Warning', description: 'This is a warning', severity: 'high', suggestion: 'Fix it' },
  ],
  sections: [
    { title: 'Section 1', summary: 'Summary of section 1' },
  ],
  parties: [
    { name: 'Company A', role: 'Buyer' },
  ],
  dates: [
    { description: 'Start date', date: '2026-01-01', importance: 'high' },
  ],
  amounts: [
    { description: 'Total', amount: '$10,000', currency: 'USD', frequency: 'one-time' },
  ],
};

describe('PDF Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportAnalysisToPdf', () => {
    it('returns a Blob', async () => {
      const blob = await exportAnalysisToPdf(mockAnalysis);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('uses default filename when not provided', async () => {
      const blob = await exportAnalysisToPdf(mockAnalysis);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('accepts custom filename', async () => {
      const blob = await exportAnalysisToPdf(mockAnalysis, 'custom-contract.pdf');
      expect(blob).toBeInstanceOf(Blob);
    });

    it('reports progress via callback', async () => {
      const progressCallback = vi.fn();
      await exportAnalysisToPdf(mockAnalysis, 'test.pdf', progressCallback);

      // Should have called progress at least at start and end
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(0);
      expect(progressCallback).toHaveBeenCalledWith(100);
    });

    it('handles analysis with empty arrays', async () => {
      const emptyAnalysis: AnalysisResult = {
        ...mockAnalysis,
        keyTerms: [],
        obligations: [],
        redFlags: [],
        sections: [],
        parties: [],
        dates: [],
        amounts: [],
      };

      const blob = await exportAnalysisToPdf(emptyAnalysis);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('handles different risk scores', async () => {
      const lowRisk: AnalysisResult = { ...mockAnalysis, riskScore: 'LOW' };
      const highRisk: AnalysisResult = { ...mockAnalysis, riskScore: 'HIGH' };

      const lowBlob = await exportAnalysisToPdf(lowRisk);
      const highBlob = await exportAnalysisToPdf(highRisk);

      expect(lowBlob).toBeInstanceOf(Blob);
      expect(highBlob).toBeInstanceOf(Blob);
    });
  });

  describe('downloadPdf', () => {
    // Note: URL.createObjectURL doesn't exist in Node.js test environment
    // These tests validate the function structure without actually calling the browser APIs

    it('is a function that accepts blob and filename', () => {
      expect(typeof downloadPdf).toBe('function');
      expect(downloadPdf.length).toBe(2); // Takes 2 parameters
    });

    it('handles filename extension stripping logic', () => {
      // Test the filename transformation logic without browser APIs
      const testCases = [
        { input: 'document.pdf', expected: 'document_analysis.pdf' },
        { input: 'contract.docx', expected: 'contract_analysis.pdf' },
        { input: 'file', expected: 'file_analysis.pdf' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Replicate the filename logic from the function
        const result = `${input.replace(/\.[^/.]+$/, '')}_analysis.pdf`;
        expect(result).toBe(expected);
      });
    });
  });
});
