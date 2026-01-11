import { describe, it, expect } from 'vitest';
import {
  getCacheHeader,
  createCacheHeaders,
  withCacheHeaders,
} from '@/lib/cache';

describe('Cache Utilities', () => {
  describe('getCacheHeader', () => {
    it('returns no-store header for mutations', () => {
      expect(getCacheHeader('no-store')).toBe(
        'no-store, no-cache, must-revalidate'
      );
    });

    it('returns private-no-cache for user-specific dynamic data', () => {
      expect(getCacheHeader('private-no-cache')).toBe(
        'private, no-cache, must-revalidate'
      );
    });

    it('returns private-short for user data that rarely changes', () => {
      const header = getCacheHeader('private-short');
      expect(header).toContain('private');
      expect(header).toContain('max-age=60');
      expect(header).toContain('stale-while-revalidate=30');
    });

    it('returns public-short for shared data', () => {
      const header = getCacheHeader('public-short');
      expect(header).toContain('public');
      expect(header).toContain('max-age=300');
    });

    it('returns public-long for static data', () => {
      const header = getCacheHeader('public-long');
      expect(header).toContain('public');
      expect(header).toContain('max-age=86400');
    });
  });

  describe('createCacheHeaders', () => {
    it('creates headers object with Cache-Control', () => {
      const headers = createCacheHeaders('no-store');
      expect(headers['Cache-Control']).toBe(
        'no-store, no-cache, must-revalidate'
      );
    });

    it('returns correct type for TypeScript', () => {
      const headers = createCacheHeaders('private-short');
      expect(typeof headers['Cache-Control']).toBe('string');
    });
  });

  describe('withCacheHeaders', () => {
    it('creates new Headers with cache control', () => {
      const headers = withCacheHeaders('private-no-cache');
      expect(headers.get('Cache-Control')).toBe(
        'private, no-cache, must-revalidate'
      );
    });

    it('adds cache control to existing headers', () => {
      const existingHeaders = { 'Content-Type': 'application/json' };
      const headers = withCacheHeaders('no-store', existingHeaders);
      expect(headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate'
      );
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('overwrites existing Cache-Control header', () => {
      const existingHeaders = {
        'Cache-Control': 'max-age=3600',
        'Content-Type': 'application/json',
      };
      const headers = withCacheHeaders('no-store', existingHeaders);
      expect(headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate'
      );
    });
  });
});
