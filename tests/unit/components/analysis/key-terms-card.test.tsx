import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyTermsCard } from '@/components/analysis/key-terms-card';
import type { KeyTerm } from '@/types';

describe('KeyTermsCard', () => {
  it('should render empty state when no key terms', () => {
    render(<KeyTermsCard keyTerms={[]} />);

    expect(screen.getByTestId('key-terms-card')).toBeInTheDocument();
    expect(screen.getByText('No key terms identified')).toBeInTheDocument();
    expect(screen.getByText('No specific key terms were identified.')).toBeInTheDocument();
  });

  it('should render key terms count in description', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Term 1',
        value: 'Value 1',
        importance: 'high',
      },
      {
        term: 'Term 2',
        value: 'Value 2',
        importance: 'medium',
      },
      {
        term: 'Term 3',
        value: 'Value 3',
        importance: 'low',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('3 important terms identified')).toBeInTheDocument();
  });

  it('should render single term with correct grammar', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Single Term',
        value: 'Single Value',
        importance: 'high',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('1 important term identified')).toBeInTheDocument();
  });

  it('should render term names and values', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Contract Duration',
        value: '2 years',
        importance: 'high',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('Contract Duration')).toBeInTheDocument();
    expect(screen.getByText('2 years')).toBeInTheDocument();
  });

  it('should display importance badge for high importance terms', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Important Term',
        value: 'Critical value',
        importance: 'high',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('Important')).toBeInTheDocument();
  });

  it('should display importance badge for medium importance terms', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Medium Term',
        value: 'Moderate value',
        importance: 'medium',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('Notable')).toBeInTheDocument();
  });

  it('should display importance badge for low importance terms', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Low Term',
        value: 'Minor value',
        importance: 'low',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should sort terms by importance (high first)', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Low Term',
        value: 'Low value',
        importance: 'low',
      },
      {
        term: 'High Term',
        value: 'High value',
        importance: 'high',
      },
      {
        term: 'Medium Term',
        value: 'Medium value',
        importance: 'medium',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    // Get all term names in order
    const termElements = screen.getAllByText(/Term$/);
    expect(termElements[0].textContent).toBe('High Term');
    expect(termElements[1].textContent).toBe('Medium Term');
    expect(termElements[2].textContent).toBe('Low Term');
  });

  it('should render explanation tooltip trigger when explanation exists', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Complex Term',
        value: 'Complex value',
        importance: 'high',
        explanation: 'This explains the complex term',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.getByText('What does this mean?')).toBeInTheDocument();
  });

  it('should not render explanation when not provided', () => {
    const keyTerms: KeyTerm[] = [
      {
        term: 'Simple Term',
        value: 'Simple value',
        importance: 'low',
      },
    ];

    render(<KeyTermsCard keyTerms={keyTerms} />);

    expect(screen.queryByText('What does this mean?')).not.toBeInTheDocument();
  });
});
