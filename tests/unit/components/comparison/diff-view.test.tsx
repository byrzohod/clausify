import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffView } from '@/components/comparison/diff-view';

describe('DiffView', () => {
  const oldText = 'line one\nline two\nline three';
  const newText = 'line one\nline TWO\nline three\nline four';

  it('renders diff view container', () => {
    render(<DiffView leftText={oldText} rightText={newText} />);
    expect(screen.getByTestId('diff-view')).toBeInTheDocument();
  });

  it('shows comparison labels', () => {
    render(
      <DiffView
        leftText={oldText}
        rightText={newText}
        leftLabel="v1.pdf"
        rightLabel="v2.pdf"
      />
    );
    expect(screen.getByText(/v1\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/v2\.pdf/)).toBeInTheDocument();
  });

  it('displays diff statistics', () => {
    render(<DiffView leftText={oldText} rightText={newText} />);
    // Should show some form of Added, Removed, Unchanged badges
    expect(screen.getByText(/Added/)).toBeInTheDocument();
    expect(screen.getByText(/Removed/)).toBeInTheDocument();
    expect(screen.getByText(/Unchanged/)).toBeInTheDocument();
  });

  it('shows diff content', () => {
    render(<DiffView leftText={oldText} rightText={newText} />);
    expect(screen.getByTestId('diff-content')).toBeInTheDocument();
  });

  it('shows no changes message for identical texts', () => {
    render(<DiffView leftText="same text" rightText="same text" />);
    expect(screen.getByTestId('diff-no-changes')).toBeInTheDocument();
    expect(screen.getByText('No differences found')).toBeInTheDocument();
  });

  it('has mode toggle buttons', () => {
    render(<DiffView leftText={oldText} rightText={newText} />);
    expect(screen.getByText('Line by Line')).toBeInTheDocument();
    expect(screen.getByText('Word by Word')).toBeInTheDocument();
  });

  it('switches between line and word mode', () => {
    render(<DiffView leftText={oldText} rightText={newText} />);

    // Click word mode button
    const wordButton = screen.getByText('Word by Word');
    fireEvent.click(wordButton);

    // Verify diff content is still shown
    expect(screen.getByTestId('diff-content')).toBeInTheDocument();
  });

  it('renders with default labels', () => {
    render(<DiffView leftText={oldText} rightText={newText} />);
    expect(screen.getByText(/Original/)).toBeInTheDocument();
    expect(screen.getByText(/Modified/)).toBeInTheDocument();
  });
});
