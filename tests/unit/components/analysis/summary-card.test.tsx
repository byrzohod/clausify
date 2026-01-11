import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '@/components/analysis/summary-card';
import type { AnalysisResult } from '@/types';

const mockAnalysis: AnalysisResult = {
  summary: 'This is a standard employment contract between Company A and Employee B.',
  contractType: 'EMPLOYMENT',
  riskScore: 'MEDIUM',
  parties: [
    { name: 'Company A', role: 'Employer' },
    { name: 'Employee B', role: 'Employee' },
  ],
  dates: [
    { date: '2026-01-01', description: 'Start Date', importance: 'high' },
    { date: '2027-01-01', description: 'End Date', importance: 'high' },
  ],
  amounts: [
    { amount: '$100,000', description: 'Annual Salary', frequency: 'yearly' },
  ],
  keyTerms: [],
  obligations: [],
  redFlags: [],
  sections: [],
};

describe('SummaryCard', () => {
  it('should render the summary card', () => {
    render(<SummaryCard analysis={mockAnalysis} />);
    expect(screen.getByTestId('summary-card')).toBeInTheDocument();
  });

  it('should display contract type', () => {
    render(<SummaryCard analysis={mockAnalysis} />);
    expect(screen.getByText('EMPLOYMENT Contract')).toBeInTheDocument();
  });

  it('should display the summary text', () => {
    render(<SummaryCard analysis={mockAnalysis} />);
    expect(screen.getByText(/This is a standard employment contract/)).toBeInTheDocument();
  });

  it('should display parties involved', () => {
    render(<SummaryCard analysis={mockAnalysis} />);
    expect(screen.getByText('Parties Involved')).toBeInTheDocument();
    expect(screen.getByText('Company A (Employer)')).toBeInTheDocument();
    expect(screen.getByText('Employee B (Employee)')).toBeInTheDocument();
  });

  it('should display key dates', () => {
    render(<SummaryCard analysis={mockAnalysis} />);
    expect(screen.getByText('Key Dates')).toBeInTheDocument();
    expect(screen.getByText('Start Date: 2026-01-01')).toBeInTheDocument();
  });

  it('should display financial terms', () => {
    render(<SummaryCard analysis={mockAnalysis} />);
    expect(screen.getByText('Financial Terms')).toBeInTheDocument();
    expect(screen.getByText('Annual Salary: $100,000 (yearly)')).toBeInTheDocument();
  });

  it('should not show parties section when empty', () => {
    const analysisNoParties = { ...mockAnalysis, parties: [] };
    render(<SummaryCard analysis={analysisNoParties} />);
    expect(screen.queryByText('Parties Involved')).not.toBeInTheDocument();
  });

  it('should not show key dates when no high importance dates', () => {
    const analysisNoImportantDates = {
      ...mockAnalysis,
      dates: [{ date: '2026-06-01', description: 'Review Date', importance: 'low' as const }],
    };
    render(<SummaryCard analysis={analysisNoImportantDates} />);
    expect(screen.queryByText('Key Dates')).not.toBeInTheDocument();
  });

  it('should not show financial terms when no amounts', () => {
    const analysisNoAmounts = { ...mockAnalysis, amounts: [] };
    render(<SummaryCard analysis={analysisNoAmounts} />);
    expect(screen.queryByText('Financial Terms')).not.toBeInTheDocument();
  });
});
