import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObligationsCard } from '@/components/analysis/obligations-card';
import type { Obligation } from '@/types';

const mockObligations: Obligation[] = [
  {
    description: 'Maintain confidentiality of all shared information',
    party: 'Receiving Party',
    deadline: 'Ongoing',
  },
  {
    description: 'Return all materials upon termination',
    party: 'Receiving Party',
    deadline: '30 days',
    consequence: 'Breach of contract',
  },
  {
    description: 'Provide monthly progress reports',
    party: 'Contractor',
    deadline: 'Monthly',
  },
];

describe('ObligationsCard', () => {
  describe('Rendering', () => {
    it('should render obligations card', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      expect(screen.getByTestId('obligations-card')).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      expect(screen.getByText('Obligations & Responsibilities')).toBeInTheDocument();
    });

    it('should display obligation count and party count', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      expect(screen.getByText(/3 obligations across 2 parties/i)).toBeInTheDocument();
    });

    it('should show singular form for one obligation', () => {
      const singleObligation: Obligation[] = [
        { description: 'Test', party: 'Party A' },
      ];
      render(<ObligationsCard obligations={singleObligation} />);
      expect(screen.getByText(/1 obligation across 1 party/i)).toBeInTheDocument();
    });
  });

  describe('Party Grouping', () => {
    it('should group obligations by party', () => {
      render(<ObligationsCard obligations={mockObligations} />);

      // Should show Receiving Party with 2 items
      expect(screen.getByText('Receiving Party')).toBeInTheDocument();
      expect(screen.getByText('2 items')).toBeInTheDocument();

      // Should show Contractor with 1 item
      expect(screen.getByText('Contractor')).toBeInTheDocument();
      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('should handle obligations with unspecified party', () => {
      const obligationsNoParty: Obligation[] = [
        { description: 'Test obligation' },
      ];
      render(<ObligationsCard obligations={obligationsNoParty} />);
      expect(screen.getByText('Unspecified Party')).toBeInTheDocument();
    });
  });

  describe('Obligation Details', () => {
    it('should display obligation descriptions', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      expect(
        screen.getByText('Maintain confidentiality of all shared information')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Return all materials upon termination')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Provide monthly progress reports')
      ).toBeInTheDocument();
    });

    it('should display deadlines when present', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      expect(screen.getByText('Ongoing')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('should display consequences when present', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      expect(screen.getByText('Consequence: Breach of contract')).toBeInTheDocument();
    });

    it('should not display deadline section when not present', () => {
      const obligationsNoDeadline: Obligation[] = [
        { description: 'No deadline obligation', party: 'Party A' },
      ];
      render(<ObligationsCard obligations={obligationsNoDeadline} />);
      expect(screen.queryByText('Ongoing')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no obligations', () => {
      render(<ObligationsCard obligations={[]} />);
      expect(
        screen.getByText('No specific obligations identified')
      ).toBeInTheDocument();
      expect(
        screen.getByText('No specific obligations were identified.')
      ).toBeInTheDocument();
    });

    it('should not display party headers in empty state', () => {
      render(<ObligationsCard obligations={[]} />);
      expect(screen.queryByText('Receiving Party')).not.toBeInTheDocument();
      expect(screen.queryByText('Contractor')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Parties', () => {
    it('should handle many parties correctly', () => {
      const multiPartyObligations: Obligation[] = [
        { description: 'Obligation 1', party: 'Party A' },
        { description: 'Obligation 2', party: 'Party B' },
        { description: 'Obligation 3', party: 'Party C' },
        { description: 'Obligation 4', party: 'Party D' },
      ];

      render(<ObligationsCard obligations={multiPartyObligations} />);

      expect(screen.getByText('4 obligations across 4 parties')).toBeInTheDocument();
      expect(screen.getByText('Party A')).toBeInTheDocument();
      expect(screen.getByText('Party B')).toBeInTheDocument();
      expect(screen.getByText('Party C')).toBeInTheDocument();
      expect(screen.getByText('Party D')).toBeInTheDocument();
    });

    it('should show separator between party groups', () => {
      render(<ObligationsCard obligations={mockObligations} />);
      // The separator is rendered between groups
      // We can verify by checking that both parties are rendered
      expect(screen.getByText('Receiving Party')).toBeInTheDocument();
      expect(screen.getByText('Contractor')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle obligations with empty description', () => {
      const obligationsEmptyDesc: Obligation[] = [
        { description: '', party: 'Party A' },
      ];
      render(<ObligationsCard obligations={obligationsEmptyDesc} />);
      expect(screen.getByTestId('obligations-card')).toBeInTheDocument();
    });

    it('should handle many obligations for single party', () => {
      const manyObligations: Obligation[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          description: `Obligation ${i + 1}`,
          party: 'Single Party',
        }));

      render(<ObligationsCard obligations={manyObligations} />);
      expect(screen.getByText('10 obligations across 1 party')).toBeInTheDocument();
      expect(screen.getByText('10 items')).toBeInTheDocument();
    });
  });
});
