import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskBadge, RiskDescription } from '@/components/analysis/risk-badge';

describe('RiskBadge', () => {
  it('renders LOW risk badge correctly', () => {
    render(<RiskBadge level="LOW" />);

    expect(screen.getByTestId('risk-badge')).toHaveTextContent('Low Risk');
  });

  it('renders MEDIUM risk badge correctly', () => {
    render(<RiskBadge level="MEDIUM" />);

    expect(screen.getByTestId('risk-badge')).toHaveTextContent('Medium Risk');
  });

  it('renders HIGH risk badge correctly', () => {
    render(<RiskBadge level="HIGH" />);

    expect(screen.getByTestId('risk-badge')).toHaveTextContent('High Risk');
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<RiskBadge level="LOW" showIcon={false} />);

    // Check that no SVG icon is rendered
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('applies custom className', () => {
    render(<RiskBadge level="LOW" className="custom-class" />);

    expect(screen.getByTestId('risk-badge')).toHaveClass('custom-class');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<RiskBadge level="LOW" size="sm" />);
    expect(screen.getByTestId('risk-badge')).toHaveClass('text-xs');

    rerender(<RiskBadge level="LOW" size="md" />);
    expect(screen.getByTestId('risk-badge')).toHaveClass('text-sm');

    rerender(<RiskBadge level="LOW" size="lg" />);
    expect(screen.getByTestId('risk-badge')).toHaveClass('text-base');
  });
});

describe('RiskDescription', () => {
  it('renders LOW risk description', () => {
    render(<RiskDescription level="LOW" />);

    expect(screen.getByText(/favorable or standard terms/i)).toBeInTheDocument();
  });

  it('renders MEDIUM risk description', () => {
    render(<RiskDescription level="MEDIUM" />);

    expect(screen.getByText(/warrant attention/i)).toBeInTheDocument();
  });

  it('renders HIGH risk description', () => {
    render(<RiskDescription level="HIGH" />);

    expect(screen.getByText(/unfavorable/i)).toBeInTheDocument();
  });
});
