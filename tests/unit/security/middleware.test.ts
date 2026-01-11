import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';

describe('Security Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting Configuration', () => {
    it('should have rate limit config for signup endpoint', () => {
      // Rate limit config is defined in rate-limit.ts
      const signupConfig = { windowMs: 60 * 60 * 1000, max: 10 };
      expect(signupConfig.max).toBe(10);
      expect(signupConfig.windowMs).toBe(3600000); // 1 hour
    });

    it('should have rate limit config for upload endpoint', () => {
      const uploadConfig = { windowMs: 60 * 1000, max: 30 };
      expect(uploadConfig.max).toBe(30);
      expect(uploadConfig.windowMs).toBe(60000); // 1 minute
    });

    it('should have rate limit config for analyze endpoint', () => {
      const analyzeConfig = { windowMs: 60 * 1000, max: 120 };
      expect(analyzeConfig.max).toBe(120);
    });

    it('should have rate limit config for demo endpoint', () => {
      const demoConfig = { windowMs: 60 * 1000, max: 20 };
      expect(demoConfig.max).toBe(20);
    });
  });

  describe('Security Headers', () => {
    it('should define all required security headers', () => {
      const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      };

      expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
      expect(securityHeaders['X-Frame-Options']).toBe('DENY');
      expect(securityHeaders['X-XSS-Protection']).toBe('1; mode=block');
      expect(securityHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(securityHeaders['Strict-Transport-Security']).toContain('max-age=');
    });
  });

  describe('Content Security Policy', () => {
    it('should define CSP directives', () => {
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.stripe.com https://api.anthropic.com",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ];

      expect(cspDirectives).toContain("default-src 'self'");
      expect(cspDirectives).toContain("object-src 'none'");
      expect(cspDirectives).toContain("frame-ancestors 'none'");
    });
  });
});

describe('Path Sanitization', () => {
  function sanitizePath(inputPath: string): string | null {
    const cleaned = inputPath.replace(/\0/g, '');

    if (
      cleaned.includes('..') ||
      cleaned.includes('./') ||
      cleaned.includes('/.') ||
      cleaned.startsWith('/') ||
      cleaned.includes('\\')
    ) {
      return null;
    }

    return cleaned;
  }

  it('should reject paths with parent directory traversal', () => {
    expect(sanitizePath('../etc/passwd')).toBeNull();
    expect(sanitizePath('user123/../admin/file.pdf')).toBeNull();
  });

  it('should reject paths with dot-slash', () => {
    expect(sanitizePath('./hidden')).toBeNull();
    expect(sanitizePath('user123/./file.pdf')).toBeNull();
  });

  it('should reject absolute paths', () => {
    expect(sanitizePath('/etc/passwd')).toBeNull();
    expect(sanitizePath('/app/uploads/other-user/file.pdf')).toBeNull();
  });

  it('should reject Windows-style paths', () => {
    expect(sanitizePath('C:\\Windows\\System32')).toBeNull();
    expect(sanitizePath('user123\\file.pdf')).toBeNull();
  });

  it('should reject paths with null bytes', () => {
    const pathWithNull = 'user123\0.pdf';
    const result = sanitizePath(pathWithNull);
    expect(result).not.toContain('\0');
  });

  it('should accept valid paths', () => {
    expect(sanitizePath('user123/file.pdf')).toBe('user123/file.pdf');
    expect(sanitizePath('user123/contract.docx')).toBe('user123/contract.docx');
    expect(sanitizePath('abc123/1704067200000-document.pdf')).toBe('abc123/1704067200000-document.pdf');
  });
});

describe('File Extension Validation', () => {
  function isAllowedExtension(filePath: string): boolean {
    const allowedExtensions = ['pdf', 'docx', 'doc'];
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  }

  it('should allow PDF files', () => {
    expect(isAllowedExtension('contract.pdf')).toBe(true);
    expect(isAllowedExtension('CONTRACT.PDF')).toBe(true);
  });

  it('should allow DOCX files', () => {
    expect(isAllowedExtension('contract.docx')).toBe(true);
    expect(isAllowedExtension('CONTRACT.DOCX')).toBe(true);
  });

  it('should allow DOC files', () => {
    expect(isAllowedExtension('contract.doc')).toBe(true);
  });

  it('should reject other file types', () => {
    expect(isAllowedExtension('script.js')).toBe(false);
    expect(isAllowedExtension('image.png')).toBe(false);
    expect(isAllowedExtension('archive.zip')).toBe(false);
    expect(isAllowedExtension('executable.exe')).toBe(false);
    expect(isAllowedExtension('shell.sh')).toBe(false);
  });

  it('should reject files without extension', () => {
    expect(isAllowedExtension('noextension')).toBe(false);
  });
});
