import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RedFlagsCard } from '@/components/analysis/red-flags-card';
import type { RedFlag } from '@/types';

describe('RedFlagsCard', () => {
  it('should render empty state when no red flags', () => {
    render(<RedFlagsCard redFlags={[]} />);

    expect(screen.getByTestId('red-flags-card')).toBeInTheDocument();
    expect(screen.getByText('No significant concerns identified')).toBeInTheDocument();
    expect(screen.getByText('No red flags detected in this contract.')).toBeInTheDocument();
  });

  it('should render red flags count in description', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'Test Flag 1',
        description: 'Description 1',
        severity: 'high',
      },
      {
        title: 'Test Flag 2',
        description: 'Description 2',
        severity: 'medium',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('2 items require attention')).toBeInTheDocument();
  });

  it('should render single flag with correct grammar', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'Single Flag',
        description: 'Only one flag',
        severity: 'low',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('1 item requires attention')).toBeInTheDocument();
  });

  it('should display high severity badge when high flags exist', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'High Severity Flag',
        description: 'This is serious',
        severity: 'high',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('1 High')).toBeInTheDocument();
  });

  it('should display medium severity badge when medium flags exist', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'Medium Flag 1',
        description: 'Medium issue',
        severity: 'medium',
      },
      {
        title: 'Medium Flag 2',
        description: 'Another medium issue',
        severity: 'medium',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('2 Medium')).toBeInTheDocument();
  });

  it('should sort flags by severity (high first)', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'Low Flag',
        description: 'Low severity',
        severity: 'low',
      },
      {
        title: 'High Flag',
        description: 'High severity',
        severity: 'high',
      },
      {
        title: 'Medium Flag',
        description: 'Medium severity',
        severity: 'medium',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    const flagTitles = screen.getAllByRole('button').map((btn) => btn.textContent);
    // High should appear before Medium, which should appear before Low
    expect(flagTitles[0]).toContain('High Flag');
    expect(flagTitles[1]).toContain('Medium Flag');
    expect(flagTitles[2]).toContain('Low Flag');
  });

  it('should render flag titles', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'Unlimited Liability Clause',
        description: 'The contract contains an unlimited liability clause',
        severity: 'high',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('Unlimited Liability Clause')).toBeInTheDocument();
  });

  it('should render flag with clause text', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'Non-Compete Clause',
        description: 'Broad non-compete restriction',
        severity: 'medium',
        clause: 'Employee shall not work for any competitor for 5 years',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('Non-Compete Clause')).toBeInTheDocument();
  });

  it('should render flag with suggestion', () => {
    const redFlags: RedFlag[] = [
      {
        title: 'One-Sided Termination',
        description: 'Only one party can terminate',
        severity: 'high',
        suggestion: 'Negotiate mutual termination rights',
      },
    ];

    render(<RedFlagsCard redFlags={redFlags} />);

    expect(screen.getByText('One-Sided Termination')).toBeInTheDocument();
  });
});
