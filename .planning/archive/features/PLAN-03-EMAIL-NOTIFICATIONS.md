# Email Notifications Plan

> Feature: Transactional and marketing email system
> Priority: MEDIUM
> Effort: Medium (2-3 days)
> Status: Planning
> Depends On: PLAN-01-PRODUCTION-DEPLOY.md

---

## Executive Summary

Implement a comprehensive email notification system for user engagement, transactional alerts, and expiration reminders. Email is critical for user retention and reducing churn.

---

## Business Value

| Metric | Impact |
|--------|--------|
| User Retention | +20-30% with email reminders |
| Churn Reduction | Expiration alerts prevent missed renewals |
| Engagement | Analysis complete notifications drive return visits |
| Trust | Professional email communication builds credibility |
| Support | Reduces support tickets with proactive communication |

---

## Email Types Required

### Transactional Emails (High Priority)

| Email | Trigger | Purpose |
|-------|---------|---------|
| Welcome | User signup | Onboarding, feature introduction |
| Email Verification | Signup | Verify email ownership |
| Password Reset | Forgot password | Security |
| Analysis Complete | Analysis finishes | Bring user back to view results |
| Payment Receipt | Successful payment | Legal requirement |
| Payment Failed | Failed payment | Prevent churn |
| Subscription Cancelled | User cancels | Feedback, win-back |

### Engagement Emails (Medium Priority)

| Email | Trigger | Purpose |
|-------|---------|---------|
| Contract Expiration | 30/14/7 days before | Remind user to renew |
| Unused Account | 14 days inactive | Re-engagement |
| Feature Announcement | New feature launch | Drive adoption |
| Upgrade Prompt | Free user hits limit | Conversion |

### Future Emails (Low Priority)

| Email | Trigger | Purpose |
|-------|---------|---------|
| Weekly Digest | Weekly cron | Summary of activity |
| Referral Invite | User shares code | Viral growth |
| Team Invite | Team feature | Collaboration |

---

## Technical Architecture

### Provider Comparison

| Provider | Free Tier | Price/1000 | Pros | Cons |
|----------|-----------|------------|------|------|
| **Resend** | 3,000/mo | $1.00 | Simple API, React Email | Newer |
| SendGrid | 100/day | $0.80 | Established, reliable | Complex |
| Postmark | 100/mo | $1.25 | Great deliverability | No free tier |
| AWS SES | 62,000/mo* | $0.10 | Cheapest at scale | Complex setup |
| Mailgun | 5,000/mo | $0.80 | Good API | EU data issues |

*AWS SES free tier only from EC2

**Recommendation:** Resend - simple API, React Email support, generous free tier.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Email System                            │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Trigger   │────▶│  Email Job  │────▶│   Resend    │   │
│  │   (API/Cron)│     │   Queue     │     │    API      │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                             │                               │
│                             ▼                               │
│                    ┌─────────────────┐                     │
│                    │  React Email    │                     │
│                    │   Templates     │                     │
│                    └─────────────────┘                     │
│                                                             │
│  Templates:                                                 │
│  - WelcomeEmail.tsx                                        │
│  - AnalysisCompleteEmail.tsx                               │
│  - ExpirationAlertEmail.tsx                                │
│  - PaymentReceiptEmail.tsx                                 │
│  - PasswordResetEmail.tsx                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Setup & Infrastructure (4 hours)

#### Step 1.1: Install Dependencies
```bash
npm install resend @react-email/components react-email
```

#### Step 1.2: Create Resend Account
1. Sign up at resend.com
2. Verify domain (add DNS records)
3. Get API key

#### Step 1.3: Configure Environment
```bash
# .env
RESEND_API_KEY="re_..."
EMAIL_FROM="Clausify <hello@clausify.app>"
```

#### Step 1.4: Create Email Client
```typescript
// src/lib/email/client.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      throw error;
    }

    console.log('[Email] Sent successfully:', { to, subject, id: data?.id });
    return data;
  } catch (error) {
    console.error('[Email] Error:', error);
    throw error;
  }
}
```

### Phase 2: Email Templates (6 hours)

#### Step 2.1: Create Base Template
```typescript
// src/lib/email/templates/base.tsx
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://clausify.app/logo.png"
            width="120"
            height="40"
            alt="Clausify"
          />
          <Section style={content}>{children}</Section>
          <Text style={footer}>
            Clausify Inc. · 123 Main St · San Francisco, CA
            <br />
            <Link href="https://clausify.app/unsubscribe">Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const content = {
  padding: '0 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
```

#### Step 2.2: Welcome Email
```typescript
// src/lib/email/templates/welcome.tsx
import { Button, Heading, Text } from '@react-email/components';
import { BaseEmail } from './base';

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <BaseEmail preview="Welcome to Clausify - AI Contract Analysis">
      <Heading style={heading}>Welcome to Clausify, {name}!</Heading>
      <Text style={paragraph}>
        You've taken the first step toward understanding your contracts better.
        Clausify uses AI to analyze legal documents and explain them in plain English.
      </Text>
      <Text style={paragraph}>Here's what you can do:</Text>
      <ul>
        <li>Upload PDF or DOCX contracts</li>
        <li>Get instant AI analysis</li>
        <li>Identify red flags and risks</li>
        <li>Understand key terms and obligations</li>
      </ul>
      <Button style={button} href="https://clausify.app/dashboard">
        Upload Your First Contract
      </Button>
      <Text style={paragraph}>
        You have 2 free analyses to get started. Need more? Check out our
        <a href="https://clausify.app/pricing"> Pro plans</a>.
      </Text>
    </BaseEmail>
  );
}
```

#### Step 2.3: Analysis Complete Email
```typescript
// src/lib/email/templates/analysis-complete.tsx
import { Button, Heading, Text } from '@react-email/components';
import { BaseEmail } from './base';

interface AnalysisCompleteEmailProps {
  fileName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  redFlagsCount: number;
  contractUrl: string;
}

export function AnalysisCompleteEmail({
  fileName,
  riskLevel,
  redFlagsCount,
  contractUrl,
}: AnalysisCompleteEmailProps) {
  const riskEmoji = {
    LOW: '🟢',
    MEDIUM: '🟡',
    HIGH: '🔴',
  };

  return (
    <BaseEmail preview={`Analysis complete: ${fileName}`}>
      <Heading style={heading}>Your Contract Analysis is Ready</Heading>
      <Text style={paragraph}>
        We've finished analyzing <strong>{fileName}</strong>.
      </Text>
      <div style={statsBox}>
        <Text style={stat}>
          Risk Level: {riskEmoji[riskLevel]} {riskLevel}
        </Text>
        <Text style={stat}>
          Red Flags Found: {redFlagsCount}
        </Text>
      </div>
      <Button style={button} href={contractUrl}>
        View Full Analysis
      </Button>
      <Text style={paragraph}>
        This analysis includes a summary, key terms, obligations, and
        negotiation tips to help you make informed decisions.
      </Text>
    </BaseEmail>
  );
}
```

#### Step 2.4: Expiration Alert Email
```typescript
// src/lib/email/templates/expiration-alert.tsx
import { Button, Heading, Text } from '@react-email/components';
import { BaseEmail } from './base';

interface ExpirationAlertEmailProps {
  contractName: string;
  expirationDate: string;
  daysUntil: number;
  contractUrl: string;
}

export function ExpirationAlertEmail({
  contractName,
  expirationDate,
  daysUntil,
  contractUrl,
}: ExpirationAlertEmailProps) {
  const urgency = daysUntil <= 7 ? 'urgent' : 'reminder';

  return (
    <BaseEmail preview={`Contract expiring in ${daysUntil} days: ${contractName}`}>
      <Heading style={heading}>
        {urgency === 'urgent' ? '⚠️ Urgent: ' : '📅 '}
        Contract Expiring Soon
      </Heading>
      <Text style={paragraph}>
        Your contract <strong>{contractName}</strong> expires on{' '}
        <strong>{expirationDate}</strong> ({daysUntil} days from now).
      </Text>
      {urgency === 'urgent' && (
        <Text style={urgentText}>
          This contract expires in less than a week. Take action now to avoid
          any disruption.
        </Text>
      )}
      <Button style={button} href={contractUrl}>
        Review Contract
      </Button>
      <Text style={paragraph}>
        Consider whether you need to renew, renegotiate, or let this contract
        expire.
      </Text>
    </BaseEmail>
  );
}
```

#### Step 2.5: Additional Templates
Create similar templates for:
- `PasswordResetEmail.tsx`
- `PaymentReceiptEmail.tsx`
- `PaymentFailedEmail.tsx`
- `SubscriptionCancelledEmail.tsx`

### Phase 3: Email Sending Integration (4 hours)

#### Step 3.1: Welcome Email on Signup
```typescript
// src/app/api/auth/signup/route.ts
import { sendEmail } from '@/lib/email/client';
import { WelcomeEmail } from '@/lib/email/templates/welcome';

// After user creation:
await sendEmail({
  to: user.email,
  subject: 'Welcome to Clausify!',
  react: WelcomeEmail({ name: user.name || 'there' }),
});
```

#### Step 3.2: Analysis Complete Notification
```typescript
// src/app/api/analyze/[id]/route.ts
import { sendEmail } from '@/lib/email/client';
import { AnalysisCompleteEmail } from '@/lib/email/templates/analysis-complete';

// After analysis completes:
await sendEmail({
  to: user.email,
  subject: `Analysis Complete: ${contract.fileName}`,
  react: AnalysisCompleteEmail({
    fileName: contract.fileName,
    riskLevel: analysis.riskScore,
    redFlagsCount: analysis.redFlags?.length || 0,
    contractUrl: `https://clausify.app/contracts/${contract.id}`,
  }),
});
```

#### Step 3.3: Payment Webhooks
```typescript
// src/app/api/webhooks/stripe/route.ts
// Add email notifications to existing webhook handlers
```

### Phase 4: Expiration Alert System (4 hours)

#### Step 4.1: Create Cron Job Endpoint
```typescript
// src/app/api/cron/expiration-alerts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/client';
import { ExpirationAlertEmail } from '@/lib/email/templates/expiration-alert';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const alerts = await prisma.expirationAlert.findMany({
    where: {
      notified: false,
      expirationDate: {
        lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    },
    include: {
      contract: true,
      user: true,
    },
  });

  let sent = 0;
  for (const alert of alerts) {
    const daysUntil = Math.ceil(
      (alert.expirationDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Only send at configured alert days (e.g., 30, 14, 7, 1)
    if ([30, 14, 7, 1].includes(daysUntil)) {
      await sendEmail({
        to: alert.user.email,
        subject: `Contract expiring in ${daysUntil} days: ${alert.contract.fileName}`,
        react: ExpirationAlertEmail({
          contractName: alert.contract.fileName,
          expirationDate: alert.expirationDate.toLocaleDateString(),
          daysUntil,
          contractUrl: `https://clausify.app/contracts/${alert.contractId}`,
        }),
      });
      sent++;

      // Mark as notified if final reminder
      if (daysUntil === 1) {
        await prisma.expirationAlert.update({
          where: { id: alert.id },
          data: { notified: true },
        });
      }
    }
  }

  return NextResponse.json({ sent, checked: alerts.length });
}
```

#### Step 4.2: Configure Cron Job
```yaml
# vercel.json (if using Vercel)
{
  "crons": [
    {
      "path": "/api/cron/expiration-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Or use Railway's cron service, or external service like cron-job.org.

### Phase 5: Email Preferences (2 hours)

#### Step 5.1: Add User Preferences
```prisma
// prisma/schema.prisma
model User {
  // ... existing fields
  emailPreferences EmailPreferences?
}

model EmailPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  analysisComplete      Boolean  @default(true)
  expirationAlerts      Boolean  @default(true)
  marketingEmails       Boolean  @default(false)
  weeklyDigest          Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### Step 5.2: Settings UI
Create email preferences page in user settings.

#### Step 5.3: Check Preferences Before Sending
```typescript
async function shouldSendEmail(userId: string, type: string): Promise<boolean> {
  const prefs = await prisma.emailPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) return true; // Default to sending

  switch (type) {
    case 'analysis_complete':
      return prefs.analysisComplete;
    case 'expiration_alert':
      return prefs.expirationAlerts;
    case 'marketing':
      return prefs.marketingEmails;
    default:
      return true;
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// tests/unit/lib/email/client.test.ts
describe('Email Client', () => {
  it('should send email successfully', async () => {
    vi.mocked(resend.emails.send).mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    });

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      react: WelcomeEmail({ name: 'Test' }),
    });

    expect(result.id).toBe('email-123');
  });

  it('should handle send errors', async () => {
    vi.mocked(resend.emails.send).mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    await expect(sendEmail({...})).rejects.toThrow();
  });
});
```

### Template Tests
```typescript
// tests/unit/lib/email/templates/welcome.test.tsx
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/lib/email/templates/welcome';

describe('WelcomeEmail', () => {
  it('should render with name', async () => {
    const html = await render(WelcomeEmail({ name: 'John' }));
    expect(html).toContain('Welcome to Clausify, John!');
  });

  it('should include dashboard link', async () => {
    const html = await render(WelcomeEmail({ name: 'John' }));
    expect(html).toContain('https://clausify.app/dashboard');
  });
});
```

### Integration Tests
- Send test email to test account
- Verify delivery in Resend dashboard
- Check spam score

### Manual Testing
- [ ] Welcome email received on signup
- [ ] Analysis complete email received
- [ ] Expiration alert received
- [ ] Unsubscribe link works
- [ ] Email renders correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile rendering is acceptable

---

## Cost Estimate

### Resend Pricing
| Tier | Emails/Month | Cost |
|------|-------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20 |
| Scale | 100,000 | $40 |

### Estimated Usage (1,000 users)
| Email Type | Est. Monthly | Notes |
|------------|-------------|-------|
| Welcome | 200 | New signups |
| Analysis Complete | 1,000 | 5 per user |
| Expiration Alerts | 100 | Based on alerts set |
| Payment | 50 | Transactions |
| **Total** | **~1,350** | Free tier covers |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Delivery Rate | > 99% |
| Open Rate | > 30% |
| Click Rate | > 10% |
| Bounce Rate | < 2% |
| Spam Rate | < 0.1% |
| Unsubscribe Rate | < 0.5% |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Emails going to spam | Medium | High | Proper SPF/DKIM, warm up IP |
| High unsubscribe rate | Low | Medium | Relevant content, frequency control |
| API rate limits | Low | Medium | Queue system, batch sending |
| Template rendering issues | Medium | Low | Test across email clients |

---

## Deliverables Checklist

### Phase 1: Infrastructure
- [ ] Resend account created
- [ ] Domain verified
- [ ] API key configured
- [ ] Email client created

### Phase 2: Templates
- [ ] Base template
- [ ] Welcome email
- [ ] Analysis complete email
- [ ] Expiration alert email
- [ ] Password reset email
- [ ] Payment receipt email

### Phase 3: Integration
- [ ] Welcome email on signup
- [ ] Analysis complete notification
- [ ] Payment webhook emails
- [ ] Expiration cron job

### Phase 4: Preferences
- [ ] Email preferences model
- [ ] Settings UI
- [ ] Preference checking

### Phase 5: Testing
- [ ] Unit tests for client
- [ ] Template tests
- [ ] Integration tests
- [ ] Manual testing across clients
