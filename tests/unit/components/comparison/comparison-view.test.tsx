import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonView } from '@/components/comparison/comparison-view';
import type { ComparisonContract } from '@/types';

describe('ComparisonView', () => {
  const mockLeftContract: ComparisonContract = {
    id: '1',
    fileName: 'contract-left.pdf',
    text: 'This is the left contract text content.',
    uploadedAt: new Date(),
  };

  const mockRightContract: ComparisonContract = {
    id: '2',
    fileName: 'contract-right.pdf',
    text: 'This is the right contract text content.',
    uploadedAt: new Date(),
  };

  it('renders empty state when no contracts', () => {
    render(<ComparisonView left={null} right={null} />);

    expect(screen.getByTestId('comparison-empty')).toBeInTheDocument();
    expect(screen.getByText('No contracts to compare')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<ComparisonView left={null} right={null} isLoading={true} />);

    expect(screen.getByTestId('comparison-loading')).toBeInTheDocument();
    expect(screen.getByText('Processing contracts...')).toBeInTheDocument();
  });

  it('renders both contracts side by side', () => {
    render(
      <ComparisonView left={mockLeftContract} right={mockRightContract} />
    );

    expect(screen.getByTestId('comparison-view')).toBeInTheDocument();
    expect(screen.getByTestId('left-contract-text')).toBeInTheDocument();
    expect(screen.getByTestId('right-contract-text')).toBeInTheDocument();
  });

  it('displays contract text content', () => {
    render(
      <ComparisonView left={mockLeftContract} right={mockRightContract} />
    );

    expect(
      screen.getByText('This is the left contract text content.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('This is the right contract text content.')
    ).toBeInTheDocument();
  });

  it('displays file names', () => {
    render(
      <ComparisonView left={mockLeftContract} right={mockRightContract} />
    );

    expect(screen.getByText('contract-left.pdf')).toBeInTheDocument();
    expect(screen.getByText('contract-right.pdf')).toBeInTheDocument();
  });

  it('renders with custom labels', () => {
    render(
      <ComparisonView
        left={mockLeftContract}
        right={mockRightContract}
        leftLabel="Original"
        rightLabel="Revised"
      />
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Revised')).toBeInTheDocument();
  });

  it('renders one contract when only left is provided', () => {
    render(<ComparisonView left={mockLeftContract} right={null} />);

    expect(screen.getByTestId('comparison-view')).toBeInTheDocument();
    expect(screen.getByTestId('left-contract-text')).toBeInTheDocument();
    expect(screen.getByText('No contract uploaded')).toBeInTheDocument();
  });

  it('renders one contract when only right is provided', () => {
    render(<ComparisonView left={null} right={mockRightContract} />);

    expect(screen.getByTestId('comparison-view')).toBeInTheDocument();
    expect(screen.getByTestId('right-contract-text')).toBeInTheDocument();
    expect(screen.getByText('No contract uploaded')).toBeInTheDocument();
  });
});
