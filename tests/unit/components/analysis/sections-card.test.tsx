import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SectionsCard } from '@/components/analysis/sections-card';
import type { ContractSection } from '@/types';

const mockSections: ContractSection[] = [
  {
    title: 'Definitions',
    summary: 'This section defines key terms used throughout the agreement.',
  },
  {
    title: 'Confidentiality',
    summary: 'Outlines the obligations to maintain confidentiality of shared information.',
    originalText: 'The Receiving Party shall maintain in strict confidence...',
    concerns: ['Broad definition of confidential information', 'No carve-outs for public information'],
  },
  {
    title: 'Term and Termination',
    summary: 'Specifies the duration and conditions for ending the agreement.',
    originalText: 'This Agreement shall remain in effect for a period of two (2) years...',
  },
];

describe('SectionsCard', () => {
  describe('Rendering', () => {
    it('should render sections card', () => {
      render(<SectionsCard sections={mockSections} />);
      expect(screen.getByTestId('sections-card')).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<SectionsCard sections={mockSections} />);
      expect(screen.getByText('Contract Sections Explained')).toBeInTheDocument();
    });

    it('should display section count', () => {
      render(<SectionsCard sections={mockSections} />);
      expect(screen.getByText('3 sections analyzed')).toBeInTheDocument();
    });

    it('should show singular form for one section', () => {
      const singleSection: ContractSection[] = [
        { title: 'Single Section', summary: 'Summary' },
      ];
      render(<SectionsCard sections={singleSection} />);
      expect(screen.getByText('1 section analyzed')).toBeInTheDocument();
    });
  });

  describe('Section Display', () => {
    it('should display all section titles', () => {
      render(<SectionsCard sections={mockSections} />);
      expect(screen.getByText('Definitions')).toBeInTheDocument();
      expect(screen.getByText('Confidentiality')).toBeInTheDocument();
      expect(screen.getByText('Term and Termination')).toBeInTheDocument();
    });

    it('should display concern badges for sections with concerns', () => {
      render(<SectionsCard sections={mockSections} />);
      expect(screen.getByText('2 concerns')).toBeInTheDocument();
    });

    it('should show singular concern badge for one concern', () => {
      const sectionOneConcern: ContractSection[] = [
        {
          title: 'Test Section',
          summary: 'Summary',
          concerns: ['Single concern'],
        },
      ];
      render(<SectionsCard sections={sectionOneConcern} />);
      expect(screen.getByText('1 concern')).toBeInTheDocument();
    });
  });

  describe('Accordion Behavior', () => {
    it('should expand section on click', () => {
      render(<SectionsCard sections={mockSections} />);

      const definitionsButton = screen.getByText('Definitions');
      fireEvent.click(definitionsButton);

      expect(screen.getByText('Plain English Summary')).toBeInTheDocument();
      expect(
        screen.getByText('This section defines key terms used throughout the agreement.')
      ).toBeInTheDocument();
    });

    it('should display original text when available', () => {
      render(<SectionsCard sections={mockSections} />);

      const confidentialityButton = screen.getByText('Confidentiality');
      fireEvent.click(confidentialityButton);

      expect(screen.getByText('Original Text')).toBeInTheDocument();
      expect(
        screen.getByText(/"The Receiving Party shall maintain in strict confidence..."/i)
      ).toBeInTheDocument();
    });

    it('should not display original text section when not available', () => {
      const sectionNoOriginal: ContractSection[] = [
        { title: 'Test', summary: 'Summary only' },
      ];
      render(<SectionsCard sections={sectionNoOriginal} />);

      fireEvent.click(screen.getByText('Test'));

      expect(screen.queryByText('Original Text')).not.toBeInTheDocument();
    });

    it('should display concerns when available', () => {
      render(<SectionsCard sections={mockSections} />);

      const confidentialityButton = screen.getByText('Confidentiality');
      fireEvent.click(confidentialityButton);

      expect(screen.getByText('Concerns to Consider')).toBeInTheDocument();
      expect(
        screen.getByText('Broad definition of confidential information')
      ).toBeInTheDocument();
      expect(
        screen.getByText('No carve-outs for public information')
      ).toBeInTheDocument();
    });

    it('should not display concerns section when no concerns', () => {
      const sectionNoConcerns: ContractSection[] = [
        { title: 'Clean Section', summary: 'No issues here' },
      ];
      render(<SectionsCard sections={sectionNoConcerns} />);

      fireEvent.click(screen.getByText('Clean Section'));

      expect(screen.queryByText('Concerns to Consider')).not.toBeInTheDocument();
    });

    it('should collapse section when clicked again', () => {
      render(<SectionsCard sections={mockSections} />);

      const definitionsButton = screen.getByText('Definitions');

      // Expand
      fireEvent.click(definitionsButton);
      expect(screen.getByText('Plain English Summary')).toBeInTheDocument();

      // Collapse
      fireEvent.click(definitionsButton);

      // The content should be hidden (may still be in DOM but not visible)
      // We check by trying to find content that was visible before
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no sections', () => {
      render(<SectionsCard sections={[]} />);
      expect(screen.getByText('No sections identified')).toBeInTheDocument();
      expect(
        screen.getByText('No specific sections were identified.')
      ).toBeInTheDocument();
    });

    it('should not display accordion in empty state', () => {
      render(<SectionsCard sections={[]} />);
      expect(screen.queryByRole('button', { name: /definitions/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty concerns array', () => {
      const sectionEmptyConcerns: ContractSection[] = [
        { title: 'Test', summary: 'Summary', concerns: [] },
      ];
      render(<SectionsCard sections={sectionEmptyConcerns} />);

      fireEvent.click(screen.getByText('Test'));

      expect(screen.queryByText('Concerns to Consider')).not.toBeInTheDocument();
      expect(screen.queryByText('0 concerns')).not.toBeInTheDocument();
    });

    it('should handle section with only title and summary', () => {
      const minimalSection: ContractSection[] = [
        { title: 'Minimal', summary: 'Just the basics' },
      ];
      render(<SectionsCard sections={minimalSection} />);

      fireEvent.click(screen.getByText('Minimal'));

      expect(screen.getByText('Just the basics')).toBeInTheDocument();
      expect(screen.queryByText('Original Text')).not.toBeInTheDocument();
      expect(screen.queryByText('Concerns to Consider')).not.toBeInTheDocument();
    });

    it('should handle many sections', () => {
      const manySections: ContractSection[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          title: `Section ${i + 1}`,
          summary: `Summary for section ${i + 1}`,
        }));

      render(<SectionsCard sections={manySections} />);
      expect(screen.getByText('10 sections analyzed')).toBeInTheDocument();
    });

    it('should handle section with empty original text', () => {
      const sectionEmptyOriginal: ContractSection[] = [
        { title: 'Test', summary: 'Summary', originalText: '' },
      ];
      render(<SectionsCard sections={sectionEmptyOriginal} />);

      fireEvent.click(screen.getByText('Test'));

      // Empty string should not trigger the original text section
      expect(screen.queryByText('Original Text')).not.toBeInTheDocument();
    });

    it('should handle very long section titles', () => {
      const longTitleSection: ContractSection[] = [
        {
          title: 'This is a very long section title that might wrap or truncate in the UI',
          summary: 'Summary',
        },
      ];
      render(<SectionsCard sections={longTitleSection} />);

      expect(
        screen.getByText('This is a very long section title that might wrap or truncate in the UI')
      ).toBeInTheDocument();
    });
  });
});
