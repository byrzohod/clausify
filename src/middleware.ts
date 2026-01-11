import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitKey,
} from '@/lib/rate-limit';

// CORS configuration - allowed origins
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[];

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Content Security Policy - Tightened for production
// Note: 'unsafe-inline' for styles is required for Tailwind/styled-jsx
// 'unsafe-eval' is required for Next.js development hot reload (removed in prod)
const isDevelopment = process.env.NODE_ENV === 'development';

const cspDirectives = [
  // Only allow resources from same origin by default
  "default-src 'self'",
  // Scripts: self + Stripe (no unsafe-eval in production)
  isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com"
    : "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  // Styles: self + inline (required for Tailwind)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + specific domains
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
  // Fonts: self only (no external fonts)
  "font-src 'self'",
  // API connections: self + Stripe + Anthropic + localhost for development
  isDevelopment
    ? "connect-src 'self' https://api.stripe.com https://api.anthropic.com http://localhost:*"
    : "connect-src 'self' https://api.stripe.com https://api.anthropic.com",
  // Frames: Stripe only for payment
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  // Block all plugins/objects
  "object-src 'none'",
  // Restrict base URI
  "base-uri 'self'",
  // Restrict form submissions
  "form-action 'self'",
  // Block embedding in frames
  "frame-ancestors 'none'",
  // Block mixed content
  "upgrade-insecure-requests",
  // Manifest source
  "manifest-src 'self'",
  // Worker source (for potential web workers)
  "worker-src 'self' blob:",
];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

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
    const origin = request.headers.get('origin');

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });

      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      return response;
    }

    const ip = getClientIp(request);
    const rateLimitKey = getRateLimitKey(pathname, ip, userId);
    const config = getRateLimitConfig(pathname);
    const { allowed, remaining, resetIn } = await checkRateLimit(rateLimitKey, config);

    if (!allowed) {
      const response = new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
            ...securityHeaders,
          },
        }
      );

      // Add CORS headers to rate limit response
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      return response;
    }

    // Continue with rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

    // Add CORS headers
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

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
