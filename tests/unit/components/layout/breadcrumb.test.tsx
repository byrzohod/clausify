import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Breadcrumb } from '@/components/layout/breadcrumb';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/dashboard/contracts'),
}));

describe('Breadcrumb', () => {
  describe('Rendering', () => {
    it('renders with custom items', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Contracts', href: '/contracts' },
        { label: 'Contract Details' },
      ];

      render(<Breadcrumb items={items} showHome={false} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Contracts')).toBeInTheDocument();
      expect(screen.getByText('Contract Details')).toBeInTheDocument();
    });

    it('renders home link when showHome is true', () => {
      render(<Breadcrumb items={[{ label: 'Page' }]} showHome={true} />);

      // Home is visually hidden but present for screen readers
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('does not render home link when showHome is false', () => {
      render(<Breadcrumb items={[{ label: 'Page' }]} showHome={false} />);

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('returns null for empty items', () => {
      const { container } = render(<Breadcrumb items={[]} showHome={false} />);

      expect(container.querySelector('nav')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation role', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('has proper list role', () => {
      render(<Breadcrumb items={[{ label: 'Test' }]} />);

      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Breadcrumb navigation');
    });

    it('marks current page with aria-current', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Current Page' },
      ];

      render(<Breadcrumb items={items} showHome={false} />);

      // The span containing the text is inside a parent with aria-current
      const currentPageSpan = screen.getByText('Current Page');
      const parentElement = currentPageSpan.closest('[aria-current="page"]');
      expect(parentElement).toBeInTheDocument();
    });

    it('does not mark linked items as current', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Current Page' },
      ];

      render(<Breadcrumb items={items} showHome={false} />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).not.toHaveAttribute('aria-current');
    });

    it('hides separator icons from screen readers', () => {
      const items = [
        { label: 'First', href: '/first' },
        { label: 'Second' },
      ];

      render(<Breadcrumb items={items} showHome={false} />);

      // There should be separator elements with aria-hidden
      const separators = document.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Links', () => {
    it('renders links for items with href', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'No Link' },
      ];

      render(<Breadcrumb items={items} showHome={false} />);

      expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
      expect(screen.queryByRole('link', { name: 'No Link' })).not.toBeInTheDocument();
    });

    it('does not render link for last item even if href provided', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Current', href: '/current' },
      ];

      render(<Breadcrumb items={items} showHome={false} />);

      // Last item should not be a link
      expect(screen.queryByRole('link', { name: 'Current' })).not.toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(
        <Breadcrumb items={[{ label: 'Test' }]} className="custom-class" />
      );

      expect(screen.getByRole('navigation')).toHaveClass('custom-class');
    });

    it('applies font-medium to current page', () => {
      const items = [{ label: 'Current Page' }];

      render(<Breadcrumb items={items} showHome={false} />);

      // The font-medium class is on the parent span, not the text span itself
      const currentPageSpan = screen.getByText('Current Page');
      const parentElement = currentPageSpan.closest('.font-medium');
      expect(parentElement).toBeInTheDocument();
    });
  });

  describe('Auto-generation', () => {
    it('generates breadcrumbs from pathname', () => {
      // usePathname is mocked to return '/dashboard/contracts'
      render(<Breadcrumb showHome={false} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Contracts')).toBeInTheDocument();
    });
  });
});
