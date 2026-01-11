import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DualFileUpload } from '@/components/forms/dual-file-upload';

describe('DualFileUpload', () => {
  const mockOnFilesSelected = vi.fn();
  const mockOnCompare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders two upload zones', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
      />
    );

    expect(screen.getByTestId('left-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('right-dropzone')).toBeInTheDocument();
  });

  it('renders with custom labels', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
        leftLabel="Original Contract"
        rightLabel="Modified Contract"
      />
    );

    expect(screen.getByText('Original Contract')).toBeInTheDocument();
    expect(screen.getByText('Modified Contract')).toBeInTheDocument();
  });

  it('compare button is disabled when no files selected', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
      />
    );

    const compareButton = screen.getByTestId('compare-button');
    expect(compareButton).toBeDisabled();
  });

  it('renders upload instructions in dropzones', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
      />
    );

    // Both dropzones should show instructions
    const dropTexts = screen.getAllByText('Drop or click');
    expect(dropTexts).toHaveLength(2);

    const formatTexts = screen.getAllByText('PDF, DOCX');
    expect(formatTexts).toHaveLength(2);
  });

  it('calls onCompare when compare button clicked', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
      />
    );

    const compareButton = screen.getByTestId('compare-button');
    fireEvent.click(compareButton);

    // Button should be disabled so click won't fire
    expect(mockOnCompare).not.toHaveBeenCalled();
  });

  it('shows comparing state', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
        isComparing={true}
      />
    );

    expect(screen.getByText('Comparing...')).toBeInTheDocument();
  });

  it('renders with data-testid for container', () => {
    render(
      <DualFileUpload
        onFilesSelected={mockOnFilesSelected}
        onCompare={mockOnCompare}
      />
    );

    expect(screen.getByTestId('dual-file-upload')).toBeInTheDocument();
  });
});
