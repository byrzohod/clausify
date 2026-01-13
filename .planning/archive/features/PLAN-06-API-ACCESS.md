# API Access Plan

> Feature: Public API for programmatic contract analysis
> Priority: LOW
> Effort: Large (1-2 weeks)
> Status: Planning
> Depends On: PLAN-01-PRODUCTION-DEPLOY.md

---

## Executive Summary

Expose Clausify's contract analysis capabilities as a RESTful API for developers and businesses. This enables integrations with CRMs, document management systems, legal tech tools, and custom applications.

---

## Business Value

| Metric | Impact |
|--------|--------|
| New Revenue Stream | API-only pricing tier ($99-499/mo) |
| Enterprise Sales | APIs enable enterprise integration |
| Partnership Opportunities | Other platforms can integrate |
| Market Expansion | Reach developers building legal tools |
| Stickiness | API integrations are hard to leave |

---

## Target Users

### Primary: Developers at Legal Tech Companies
- Building contract management systems
- Need analysis as a feature, not core product
- Volume: 1,000-10,000 analyses/month

### Secondary: Enterprise IT Teams
- Integrating with existing document workflows
- Connecting to Salesforce, DocuSign, SharePoint
- Volume: 100-5,000 analyses/month

### Tertiary: Individual Developers
- Building side projects
- Experimenting with legal AI
- Volume: 10-100 analyses/month

---

## API Scope

### MVP Endpoints (v1)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/contracts` | POST | Upload contract for analysis |
| `/v1/contracts/{id}` | GET | Get contract and analysis |
| `/v1/contracts/{id}/analysis` | GET | Get analysis only |
| `/v1/contracts` | GET | List user's contracts |
| `/v1/contracts/{id}` | DELETE | Delete contract |
| `/v1/usage` | GET | Get API usage stats |
| `/v1/webhooks` | POST | Register webhook |
| `/v1/webhooks/{id}` | DELETE | Remove webhook |

### Future Endpoints (v2)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/contracts/compare` | POST | Compare two contracts |
| `/v1/templates` | GET/POST | Manage templates |
| `/v1/contracts/{id}/export` | GET | Export as PDF |
| `/v1/batch` | POST | Batch analysis |

---

## Technical Architecture

### API Gateway Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────────┐ │
│  │    Rate     │────▶│    Auth     │────▶│   Routing     │ │
│  │   Limiter   │     │  (API Key)  │     │               │ │
│  └─────────────┘     └─────────────┘     └───────┬───────┘ │
│                                                   │         │
└───────────────────────────────────────────────────┼─────────┘
                                                    │
                    ┌───────────────────────────────┼───────┐
                    │                               │       │
                    ▼                               ▼       ▼
          ┌─────────────────┐           ┌───────────────────┐
          │  Contract API   │           │   Analysis API    │
          │  /v1/contracts  │           │   /v1/analyze     │
          └─────────────────┘           └───────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                          ┌─────────────────┐
                          │   PostgreSQL    │
                          │   + Storage     │
                          └─────────────────┘
```

### Authentication Flow

```
┌──────────┐          ┌───────────┐          ┌─────────────┐
│  Client  │──────────│  API Key  │──────────│   Clausify  │
│          │   API    │  Header   │  Verify  │    API      │
└──────────┘  Request └───────────┘   Key    └─────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Check:        │
                    │ - Key valid   │
                    │ - Key active  │
                    │ - Rate limit  │
                    │ - Quota       │
                    └───────────────┘
```

---

## Implementation Plan

### Phase 1: API Key Infrastructure (6 hours)

#### Step 1.1: API Key Model
```prisma
// prisma/schema.prisma
model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String   // User-provided name for the key
  key         String   @unique // The actual API key (hashed)
  prefix      String   // First 8 chars for identification
  lastUsed    DateTime?
  expiresAt   DateTime?
  rateLimit   Int      @default(100) // Requests per minute
  createdAt   DateTime @default(now())
  isActive    Boolean  @default(true)

  @@index([key])
  @@index([userId])
  @@map("api_keys")
}

model ApiUsage {
  id        String   @id @default(cuid())
  apiKeyId  String
  apiKey    ApiKey   @relation(fields: [apiKeyId], references: [id])
  endpoint  String
  method    String
  status    Int
  duration  Int      // ms
  timestamp DateTime @default(now())

  @@index([apiKeyId, timestamp])
  @@map("api_usage")
}
```

#### Step 1.2: API Key Generation
```typescript
// src/lib/api-keys.ts
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const API_KEY_PREFIX = 'clsfy_';

export async function generateApiKey(userId: string, name: string) {
  // Generate random key
  const rawKey = crypto.randomBytes(32).toString('hex');
  const fullKey = `${API_KEY_PREFIX}${rawKey}`;

  // Hash for storage
  const hashedKey = crypto
    .createHash('sha256')
    .update(fullKey)
    .digest('hex');

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      key: hashedKey,
      prefix: fullKey.substring(0, 12), // For display: "clsfy_a1b2..."
    },
  });

  // Return full key ONCE (user must save it)
  return {
    id: apiKey.id,
    key: fullKey, // Only time the full key is returned
    prefix: apiKey.prefix,
    name: apiKey.name,
  };
}

export async function validateApiKey(key: string): Promise<ApiKey | null> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const hashedKey = crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    include: { user: true },
  });

  if (!apiKey || !apiKey.isActive) {
    return null;
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() },
  });

  return apiKey;
}
```

#### Step 1.3: API Key Management Endpoints
```typescript
// src/app/api/v1/keys/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-keys';

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsed: true,
      createdAt: true,
      isActive: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();

  const key = await generateApiKey(session.user.id, name);

  return NextResponse.json({
    key: key.key, // Full key - shown only once
    id: key.id,
    name: key.name,
    message: 'Save this key securely. It will not be shown again.',
  });
}
```

### Phase 2: API Middleware (4 hours)

#### Step 2.1: API Authentication Middleware
```typescript
// src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-keys';
import { checkApiRateLimit } from '@/lib/api/rate-limit';
import { logApiUsage } from '@/lib/api/usage';

export async function withApiAuth(
  request: NextRequest,
  handler: (req: NextRequest, apiKey: ApiKey) => Promise<NextResponse>
) {
  const startTime = Date.now();

  // Extract API key from header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing API key. Use: Authorization: Bearer <your-key>' },
      { status: 401 }
    );
  }

  const key = authHeader.substring(7);

  // Validate key
  const apiKey = await validateApiKey(key);
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Invalid or expired API key' },
      { status: 401 }
    );
  }

  // Check rate limit
  const rateLimitResult = await checkApiRateLimit(apiKey);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        limit: rateLimitResult.limit,
        remaining: 0,
        resetAt: rateLimitResult.resetAt,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const response = await handler(request, apiKey);

    // Log usage
    await logApiUsage({
      apiKeyId: apiKey.id,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      status: response.status,
      duration: Date.now() - startTime,
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toISOString());

    return response;
  } catch (error) {
    console.error('[API] Handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Phase 3: API Endpoints (8 hours)

#### Step 3.1: Upload Contract
```typescript
// src/app/api/v1/contracts/route.ts
import { withApiAuth } from '@/lib/api/middleware';

export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOCX' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Upload and create contract
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = await uploadFile(buffer, file.name, apiKey.userId);

    const contract = await prisma.contract.create({
      data: {
        userId: apiKey.userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath,
        status: 'PENDING',
      },
    });

    // Optionally auto-analyze
    const autoAnalyze = formData.get('auto_analyze') !== 'false';
    if (autoAnalyze) {
      // Trigger analysis (async)
      await triggerAnalysis(contract.id);
    }

    return NextResponse.json({
      id: contract.id,
      fileName: contract.fileName,
      status: contract.status,
      createdAt: contract.createdAt,
      links: {
        self: `/v1/contracts/${contract.id}`,
        analysis: `/v1/contracts/${contract.id}/analysis`,
      },
    }, { status: 201 });
  });
}

export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const where = {
      userId: apiKey.userId,
      ...(status && { status }),
    };

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          analysis: {
            select: { status: true, riskScore: true },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({
      data: contracts.map(c => ({
        id: c.id,
        fileName: c.fileName,
        status: c.status,
        riskScore: c.analysis?.riskScore,
        createdAt: c.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  });
}
```

#### Step 3.2: Get Contract & Analysis
```typescript
// src/app/api/v1/contracts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        userId: apiKey.userId,
      },
      include: {
        analysis: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: contract.id,
      fileName: contract.fileName,
      fileSize: contract.fileSize,
      mimeType: contract.mimeType,
      status: contract.status,
      createdAt: contract.createdAt,
      analysis: contract.analysis ? {
        status: contract.analysis.status,
        riskScore: contract.analysis.riskScore,
        contractType: contract.analysis.contractType,
        summary: contract.analysis.summary,
        keyTerms: contract.analysis.keyTerms,
        obligations: contract.analysis.obligations,
        redFlags: contract.analysis.redFlags,
        sections: contract.analysis.sections,
        negotiationTips: contract.analysis.negotiationTips,
        analyzedAt: contract.analysis.updatedAt,
      } : null,
    });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        userId: apiKey.userId,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    await prisma.contract.delete({ where: { id: params.id } });

    return NextResponse.json({ deleted: true });
  });
}
```

#### Step 3.3: Trigger Analysis
```typescript
// src/app/api/v1/contracts/[id]/analyze/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        userId: apiKey.userId,
      },
      include: { analysis: true },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.analysis?.status === 'COMPLETED') {
      return NextResponse.json({
        message: 'Analysis already completed',
        analysisId: contract.analysis.id,
      });
    }

    // Trigger analysis
    await triggerAnalysis(contract.id);

    return NextResponse.json({
      message: 'Analysis started',
      status: 'PROCESSING',
      pollUrl: `/v1/contracts/${contract.id}/analysis`,
    }, { status: 202 });
  });
}
```

### Phase 4: Webhooks (6 hours)

#### Step 4.1: Webhook Model
```prisma
model Webhook {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  url         String
  secret      String   // For signature verification
  events      String[] // ["analysis.completed", "contract.uploaded"]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("webhooks")
}
```

#### Step 4.2: Webhook Delivery
```typescript
// src/lib/webhooks.ts
import crypto from 'crypto';

export async function deliverWebhook(
  webhook: Webhook,
  event: string,
  payload: object
) {
  const timestamp = Date.now();
  const body = JSON.stringify({ event, data: payload, timestamp });

  // Generate signature
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(body)
    .digest('hex');

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Clausify-Signature': signature,
        'X-Clausify-Timestamp': String(timestamp),
      },
      body,
    });

    if (!response.ok) {
      console.error(`[Webhook] Delivery failed: ${response.status}`);
      // Queue for retry
    }
  } catch (error) {
    console.error('[Webhook] Delivery error:', error);
    // Queue for retry
  }
}

// Call after analysis completes
export async function notifyAnalysisComplete(contract: Contract) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId: contract.userId,
      isActive: true,
      events: { has: 'analysis.completed' },
    },
  });

  for (const webhook of webhooks) {
    await deliverWebhook(webhook, 'analysis.completed', {
      contractId: contract.id,
      fileName: contract.fileName,
      riskScore: contract.analysis?.riskScore,
    });
  }
}
```

### Phase 5: Documentation (4 hours)

#### Step 5.1: OpenAPI Specification
```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: Clausify API
  version: 1.0.0
  description: AI-powered contract analysis API

servers:
  - url: https://clausify.app/api/v1
    description: Production

security:
  - bearerAuth: []

paths:
  /contracts:
    post:
      summary: Upload a contract
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                auto_analyze:
                  type: boolean
                  default: true
      responses:
        201:
          description: Contract uploaded
        400:
          description: Invalid request
        401:
          description: Unauthorized
```

#### Step 5.2: API Documentation Page
Create interactive documentation using Swagger UI or Redoc.

### Phase 6: API Pricing & Limits (2 hours)

#### Pricing Tiers

| Tier | Price | Analyses/Month | Rate Limit | Features |
|------|-------|----------------|------------|----------|
| Developer | Free | 100 | 10/min | Basic analysis |
| Startup | $49/mo | 1,000 | 60/min | + Webhooks |
| Business | $199/mo | 5,000 | 120/min | + Priority support |
| Enterprise | Custom | Unlimited | Custom | + SLA, dedicated |

---

## Testing Strategy

### Unit Tests
```typescript
describe('API Key Validation', () => {
  it('should validate correct API key', async () => {
    const { key } = await generateApiKey('user-1', 'Test Key');
    const result = await validateApiKey(key);
    expect(result).not.toBeNull();
  });

  it('should reject invalid API key', async () => {
    const result = await validateApiKey('invalid-key');
    expect(result).toBeNull();
  });
});

describe('API Endpoints', () => {
  it('should upload contract via API', async () => {
    const response = await fetch('/api/v1/contracts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testApiKey}` },
      body: formData,
    });
    expect(response.status).toBe(201);
  });
});
```

### Integration Tests
- Full upload → analyze → retrieve flow
- Webhook delivery
- Rate limiting behavior

### Load Tests
- Test rate limiting under load
- Test concurrent uploads
- Measure response times

---

## Security Considerations

1. **API Key Security:** Hash keys in database, never log full keys
2. **Rate Limiting:** Per-key limits to prevent abuse
3. **Input Validation:** Validate all inputs, file types, sizes
4. **Webhook Security:** Signature verification
5. **Data Isolation:** Users can only access their own data

---

## Success Metrics

| Metric | Target |
|--------|--------|
| API Uptime | 99.9% |
| Response Time (p95) | < 500ms |
| Developer Signups | 100 in 3 months |
| Paid Conversions | 10% |
| API Revenue | $2,000/mo in 6 months |

---

## Deliverables Checklist

- [ ] API key infrastructure
- [ ] Authentication middleware
- [ ] Rate limiting
- [ ] Core endpoints (CRUD, analyze)
- [ ] Webhooks
- [ ] Usage tracking
- [ ] OpenAPI specification
- [ ] Documentation site
- [ ] API management UI
- [ ] Pricing implementation
- [ ] Unit tests
- [ ] Integration tests
