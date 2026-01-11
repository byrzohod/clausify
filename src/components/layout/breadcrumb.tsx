'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route to breadcrumb label mapping
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  contracts: 'Contracts',
  settings: 'Settings',
  pricing: 'Pricing',
  demo: 'Demo',
  about: 'About',
  contact: 'Contact',
  blog: 'Blog',
};

/**
 * Accessible breadcrumb navigation component.
 * Automatically generates breadcrumbs from the current path or accepts custom items.
 */
export function Breadcrumb({
  items,
  className,
  showHome = true,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if no items provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);

  // Add home link if enabled
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/' }, ...breadcrumbs]
    : breadcrumbs;

  if (allItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm', className)}
    >
      <ol
        className="flex items-center space-x-1"
        role="list"
        aria-label="Breadcrumb navigation"
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <Fragment key={item.href || item.label}>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground',
                      isFirst && 'text-foreground'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {isFirst && showHome && (
                      <Home className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className={isFirst && showHome ? 'sr-only' : ''}>
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {isFirst && showHome && (
                      <Home className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className={isFirst && showHome ? 'sr-only' : ''}>
                      {item.label}
                    </span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumb items from a pathname.
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip route groups like (dashboard), (marketing)
    if (segment.startsWith('(') && segment.endsWith(')')) {
      continue;
    }

    // Check if this looks like an ID (e.g., contracts/[id])
    const isId = /^[a-z0-9]{20,}$/i.test(segment);

    if (isId) {
      // For IDs, use a generic label
      breadcrumbs.push({
        label: 'Details',
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    } else {
      // Use mapped label or capitalize the segment
      const label = routeLabels[segment] || capitalize(segment);
      breadcrumbs.push({
        label,
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    }
  }

  return breadcrumbs;
}

/**
 * Capitalize first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

/**
 * Hook to use breadcrumbs with custom items.
 * Useful for dynamic pages like contract details.
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]): BreadcrumbItem[] {
  const pathname = usePathname();
  return customItems || generateBreadcrumbs(pathname);
}
