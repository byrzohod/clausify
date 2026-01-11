import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock next-auth
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn().mockResolvedValue(null),
}));

// Mock rate-limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 100, resetIn: 60000 }),
  getRateLimitConfig: vi.fn().mockReturnValue({ windowMs: 60000, max: 100 }),
  getRateLimitKey: vi.fn().mockReturnValue('test-key'),
}));

import { middleware } from '@/middleware';

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Security Headers', () => {
    it('adds X-Content-Type-Options header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('adds X-Frame-Options header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('adds X-XSS-Protection header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('adds Strict-Transport-Security header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });

    it('adds Referrer-Policy header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Content Security Policy', () => {
    it('includes CSP header on API routes', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toBeTruthy();
    });

    it('blocks object-src', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("object-src 'none'");
    });

    it('restricts frame-ancestors', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('restricts base-uri', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("base-uri 'self'");
    });

    it('allows Stripe in frame-src', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain('https://js.stripe.com');
    });

    it('includes upgrade-insecure-requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });

  describe('CORS', () => {
    it('handles OPTIONS preflight requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(204);
    });

    it('adds CORS headers for allowed origins', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      const response = await middleware(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Rate Limiting', () => {
    it('adds rate limit headers to API responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request);

      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });

  describe('Static Files', () => {
    it('skips middleware for _next paths', async () => {
      const request = new NextRequest('http://localhost:3000/_next/static/chunk.js');
      const response = await middleware(request);

      // Should pass through without modifications
      expect(response).toBeDefined();
    });

    it('skips middleware for static files', async () => {
      const request = new NextRequest('http://localhost:3000/favicon.ico');
      const response = await middleware(request);

      expect(response).toBeDefined();
    });
  });
});
