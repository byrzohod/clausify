import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalysisResults } from '@/components/analysis/analysis-results';
import type { AnalysisResult } from '@/types';

// Mock the lazy-loaded card components to avoid dynamic import issues in tests
vi.mock('@/components/analysis/red-flags-card', () => ({
  RedFlagsCard: ({ redFlags }: { redFlags: unknown[] }) => (
    <div data-testid="red-flags-card">Red Flags: {redFlags.length}</div>
  ),
}));

vi.mock('@/components/analysis/obligations-card', () => ({
  ObligationsCard: ({ obligations }: { obligations: unknown[] }) => (
    <div data-testid="obligations-card">Obligations: {obligations.length}</div>
  ),
}));

vi.mock('@/components/analysis/key-terms-card', () => ({
  KeyTermsCard: ({ keyTerms }: { keyTerms: unknown[] }) => (
    <div data-testid="key-terms-card">Key Terms: {keyTerms.length}</div>
  ),
}));

vi.mock('@/components/analysis/sections-card', () => ({
  SectionsCard: ({ sections }: { sections: unknown[] }) => (
    <div data-testid="sections-card">Sections: {sections.length}</div>
  ),
}));

// Mock the export functions
vi.mock('@/lib/export', () => ({
  exportAnalysisToPdf: vi.fn(),
  downloadPdf: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { exportAnalysisToPdf, downloadPdf } from '@/lib/export';
import { toast } from 'sonner';

const mockAnalysis: AnalysisResult = {
  summary: 'This is a test NDA between Company A and Company B.',
  contractType: 'NDA',
  riskScore: 'MEDIUM',
  keyTerms: [
    { term: 'Confidential Information', definition: 'Any non-public information' },
    { term: 'Term', definition: '2 years from signing' },
  ],
  obligations: [
    { description: 'Maintain confidentiality', party: 'Recipient', deadline: 'Ongoing' },
    { description: 'Return materials', party: 'Recipient', deadline: '30 days after termination' },
  ],
  redFlags: [
    { description: 'Unlimited liability clause', severity: 'high' },
    { description: 'One-sided termination rights', severity: 'medium' },
  ],
  sections: [
    { title: 'Definitions', summary: 'Defines key terms used in the agreement' },
    { title: 'Obligations', summary: 'Lists the duties of each party' },
  ],
  parties: ['Company A', 'Company B'],
  dates: ['January 1, 2026'],
  amounts: ['$10,000 penalty'],
};

describe('AnalysisResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render analysis results container', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);
      expect(screen.getByTestId('analysis-results')).toBeInTheDocument();
    });

    it('should display the header with "Analysis Results"', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    });

    it('should display filename when provided', () => {
      render(<AnalysisResults analysis={mockAnalysis} fileName="contract.pdf" />);
      expect(screen.getByText('for contract.pdf')).toBeInTheDocument();
    });

    it('should not display filename when not provided', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);
      expect(screen.queryByText(/^for /)).not.toBeInTheDocument();
    });

    it('should display export PDF button', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
    });

    it('should display disclaimer section', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);
      expect(screen.getByText('Disclaimer')).toBeInTheDocument();
      expect(screen.getByText(/informational purposes only/i)).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should display all four tabs', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      expect(screen.getByRole('tab', { name: /red flags \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /obligations \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /key terms \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sections \(2\)/i })).toBeInTheDocument();
    });

    it('should display correct counts in tabs', () => {
      const analysisWithDifferentCounts: AnalysisResult = {
        ...mockAnalysis,
        redFlags: [{ description: 'Flag 1', severity: 'high' }],
        obligations: [{}, {}, {}] as AnalysisResult['obligations'],
        keyTerms: [],
        sections: [{}, {}, {}, {}] as AnalysisResult['sections'],
      };

      render(<AnalysisResults analysis={analysisWithDifferentCounts} />);

      expect(screen.getByRole('tab', { name: /red flags \(1\)/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /obligations \(3\)/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /key terms \(0\)/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sections \(4\)/i })).toBeInTheDocument();
    });

    it('should show red flags tab by default', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      const redFlagsTab = screen.getByRole('tab', { name: /red flags/i });
      expect(redFlagsTab).toHaveAttribute('data-state', 'active');
    });

    it('should render all tabs as clickable', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      const tabs = [
        screen.getByRole('tab', { name: /red flags/i }),
        screen.getByRole('tab', { name: /obligations/i }),
        screen.getByRole('tab', { name: /key terms/i }),
        screen.getByRole('tab', { name: /sections/i }),
      ];

      // Verify all tabs exist and are enabled
      tabs.forEach((tab) => {
        expect(tab).toBeInTheDocument();
        expect(tab).not.toBeDisabled();
      });
    });
  });

  describe('PDF Export', () => {
    it('should call export function when button clicked', async () => {
      vi.mocked(exportAnalysisToPdf).mockResolvedValue(new Blob(['test']));

      render(<AnalysisResults analysis={mockAnalysis} fileName="test.pdf" />);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportAnalysisToPdf).toHaveBeenCalledWith(mockAnalysis, 'test.pdf');
        expect(downloadPdf).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('PDF exported successfully!');
      });
    });

    it('should show error toast when export fails', async () => {
      vi.mocked(exportAnalysisToPdf).mockRejectedValue(new Error('Export failed'));

      render(<AnalysisResults analysis={mockAnalysis} />);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to export PDF');
      });
    });

    it('should disable button while exporting', async () => {
      vi.mocked(exportAnalysisToPdf).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(new Blob(['test'])), 100))
      );

      render(<AnalysisResults analysis={mockAnalysis} />);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      fireEvent.click(exportButton);

      expect(exportButton).toBeDisabled();

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should use default filename when none provided', async () => {
      vi.mocked(exportAnalysisToPdf).mockResolvedValue(new Blob(['test']));

      render(<AnalysisResults analysis={mockAnalysis} />);

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(downloadPdf).toHaveBeenCalledWith(expect.any(Blob), 'Contract');
      });
    });
  });

  describe('Empty States', () => {
    it('should handle analysis with no red flags', () => {
      const analysisNoFlags: AnalysisResult = { ...mockAnalysis, redFlags: [] };

      render(<AnalysisResults analysis={analysisNoFlags} />);
      expect(screen.getByRole('tab', { name: /red flags \(0\)/i })).toBeInTheDocument();
    });

    it('should handle analysis with no obligations', () => {
      const analysisNoObligations: AnalysisResult = { ...mockAnalysis, obligations: [] };

      render(<AnalysisResults analysis={analysisNoObligations} />);
      expect(screen.getByRole('tab', { name: /obligations \(0\)/i })).toBeInTheDocument();
    });

    it('should handle analysis with no key terms', () => {
      const analysisNoTerms: AnalysisResult = { ...mockAnalysis, keyTerms: [] };

      render(<AnalysisResults analysis={analysisNoTerms} />);
      expect(screen.getByRole('tab', { name: /key terms \(0\)/i })).toBeInTheDocument();
    });

    it('should handle analysis with no sections', () => {
      const analysisNoSections: AnalysisResult = { ...mockAnalysis, sections: [] };

      render(<AnalysisResults analysis={analysisNoSections} />);
      expect(screen.getByRole('tab', { name: /sections \(0\)/i })).toBeInTheDocument();
    });
  });

  describe('Tab Configuration', () => {
    // Note: Tab switching behavior is tested through E2E tests since Radix UI
    // TabsTrigger doesn't respond to fireEvent in this test environment.
    // These tests verify tab setup and accessibility.

    it('should render red flags tab as default active tab', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      const redFlagsTab = screen.getByRole('tab', { name: /red flags/i });
      expect(redFlagsTab).toHaveAttribute('data-state', 'active');
    });

    it('should have all tabs accessible', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);

      tabs.forEach(tab => {
        expect(tab).not.toBeDisabled();
        expect(tab).toHaveAttribute('role', 'tab');
      });
    });

    it('should have correct tab panel associations', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      // Each tab should have an aria-controls attribute
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-controls');
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should have tab list with correct role', () => {
      render(<AnalysisResults analysis={mockAnalysis} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
    });
  });
});
