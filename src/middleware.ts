import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rate limiting store (in-memory - use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint pattern
const rateLimitConfig: Record<string, { windowMs: number; max: number }> = {
  '/api/auth/signup': { windowMs: 60 * 60 * 1000, max: 5 }, // 5 signups per hour per IP
  '/api/contracts/upload': { windowMs: 60 * 1000, max: 10 }, // 10 uploads per minute per user
  '/api/analyze': { windowMs: 60 * 1000, max: 5 }, // 5 analyses per minute per user
  '/api/demo': { windowMs: 60 * 60 * 1000, max: 2 }, // 2 demos per hour per IP
  '/api/billing': { windowMs: 60 * 1000, max: 10 }, // 10 billing requests per minute
  'default': { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute default
};

function getRateLimitKey(request: NextRequest, userId?: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return userId ? `user:${userId}` : `ip:${ip}`;
}

function getRateLimitConfig(pathname: string): { windowMs: number; max: number } {
  for (const [pattern, config] of Object.entries(rateLimitConfig)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  return rateLimitConfig.default;
}

function checkRateLimit(key: string, config: { windowMs: number; max: number }): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetIn: config.windowMs };
  }

  if (record.count >= config.max) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: config.max - record.count, resetIn: record.resetTime - now };
}

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Content Security Policy
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Get user token for authenticated rate limiting
  let userId: string | undefined;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    userId = token?.sub;
  } catch {
    // Not authenticated, will use IP-based rate limiting
  }

  // Apply rate limiting for API routes
  if (pathname.startsWith('/api')) {
    const rateLimitKey = getRateLimitKey(request, userId);
    const config = getRateLimitConfig(pathname);
    const { allowed, remaining, resetIn } = checkRateLimit(rateLimitKey, config);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(resetIn / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
            ...securityHeaders,
          }
        }
      );
    }

    // Continue with rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

    // Add security headers
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
