# Team Workspaces Plan

> Feature: Multi-user workspaces for teams and organizations
> Priority: LOW
> Effort: Extra Large (3-4 weeks)
> Status: Planning
> Depends On: PLAN-01-PRODUCTION-DEPLOY.md

---

## Executive Summary

Add team/organization workspaces to Clausify, enabling multiple users to collaborate on contract analysis. This is essential for B2B sales and enterprise adoption.

---

## Business Value

| Metric | Impact |
|--------|--------|
| Revenue | 3-5x higher ARPU for teams vs individuals |
| Market Expansion | Opens enterprise market |
| Retention | Teams have higher retention than individuals |
| Virality | Team invites = organic growth |
| Competitive | Required for enterprise sales |

---

## Feature Scope

### MVP (v1.0)
- Create/manage workspaces
- Invite team members
- Role-based access (Admin, Member, Viewer)
- Shared contract library
- Workspace-level billing

### Future (v2.0)
- SSO/SAML integration
- Audit logs
- Custom branding
- Advanced permissions
- Workspace templates
- Cross-workspace sharing

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Workspace    │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ email           │       │ name            │
│ name            │       │ slug            │
│ personalPlan    │       │ plan            │
│ ...             │       │ ownerId         │
└────────┬────────┘       │ ...             │
         │                └────────┬────────┘
         │                         │
         │    ┌────────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────┐
│   WorkspaceMembership   │
├─────────────────────────┤
│ id                      │
│ userId                  │
│ workspaceId             │
│ role (OWNER/ADMIN/      │
│       MEMBER/VIEWER)    │
│ invitedBy               │
│ joinedAt                │
└─────────────────────────┘
         │
         │
         ▼
┌─────────────────────────┐
│       Contract          │
├─────────────────────────┤
│ id                      │
│ workspaceId (nullable)  │  ◄── If set, belongs to workspace
│ userId                  │  ◄── Creator
│ ...                     │
└─────────────────────────┘
```

### Prisma Schema

```prisma
// prisma/schema.prisma

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum WorkspacePlan {
  TEAM_MONTHLY
  TEAM_YEARLY
  BUSINESS_MONTHLY
  BUSINESS_YEARLY
  ENTERPRISE
}

model Workspace {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  plan            WorkspacePlan @default(TEAM_MONTHLY)
  stripeCustomerId String?
  stripeSubscriptionId String?
  maxMembers      Int      @default(5)
  analysesLimit   Int      @default(100)
  analysesUsed    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  members         WorkspaceMembership[]
  contracts       Contract[]
  invitations     WorkspaceInvitation[]

  @@map("workspaces")
}

model WorkspaceMembership {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  role        WorkspaceRole @default(MEMBER)
  invitedBy   String?
  joinedAt    DateTime @default(now())

  @@unique([userId, workspaceId])
  @@map("workspace_memberships")
}

model WorkspaceInvitation {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  email       String
  role        WorkspaceRole @default(MEMBER)
  token       String   @unique
  invitedBy   String
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@unique([workspaceId, email])
  @@map("workspace_invitations")
}

// Update Contract model
model Contract {
  // ... existing fields
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId])
}

// Update User model
model User {
  // ... existing fields
  workspaces  WorkspaceMembership[]
}
```

---

## Implementation Plan

### Phase 1: Database & Models (6 hours)

#### Step 1.1: Create Migrations
```bash
npx prisma migrate dev --name add_workspaces
```

#### Step 1.2: Workspace Service
```typescript
// src/lib/workspaces/index.ts
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function createWorkspace(
  userId: string,
  name: string
): Promise<Workspace> {
  // Generate unique slug
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const slug = `${baseSlug}-${nanoid(6)}`;

  return prisma.$transaction(async (tx) => {
    // Create workspace
    const workspace = await tx.workspace.create({
      data: {
        name,
        slug,
      },
    });

    // Add creator as owner
    await tx.workspaceMembership.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    return workspace;
  });
}

export async function getWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: true },
      },
    },
  });
}

export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, contracts: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
    memberCount: m.workspace._count.members,
    contractCount: m.workspace._count.contracts,
  }));
}
```

### Phase 2: Invitation System (8 hours)

#### Step 2.1: Invite Service
```typescript
// src/lib/workspaces/invitations.ts
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/client';
import { WorkspaceInviteEmail } from '@/lib/email/templates/workspace-invite';

export async function createInvitation(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
  invitedBy: string
) {
  // Check if already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaces: { where: { workspaceId } },
    },
  });

  if (existingUser?.workspaces.length) {
    throw new Error('User is already a member of this workspace');
  }

  // Check workspace limits
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { members: true } } },
  });

  if (workspace._count.members >= workspace.maxMembers) {
    throw new Error('Workspace has reached member limit');
  }

  // Create invitation
  const token = crypto.randomBytes(32).toString('hex');
  const invitation = await prisma.workspaceInvitation.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    update: {
      token,
      role,
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    create: {
      workspaceId,
      email,
      role,
      token,
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Send invitation email
  const inviter = await prisma.user.findUnique({ where: { id: invitedBy } });
  await sendEmail({
    to: email,
    subject: `You've been invited to ${workspace.name} on Clausify`,
    react: WorkspaceInviteEmail({
      workspaceName: workspace.name,
      inviterName: inviter?.name || 'A team member',
      inviteUrl: `https://clausify.app/invite/${token}`,
      role,
    }),
  });

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invitation) {
    throw new Error('Invalid invitation');
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('Invitation has expired');
  }

  // Add user to workspace
  await prisma.$transaction([
    prisma.workspaceMembership.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      },
    }),
    prisma.workspaceInvitation.delete({
      where: { id: invitation.id },
    }),
  ]);

  return invitation.workspace;
}
```

### Phase 3: Access Control (8 hours)

#### Step 3.1: Permission Definitions
```typescript
// src/lib/workspaces/permissions.ts

export const WORKSPACE_PERMISSIONS = {
  // Contract permissions
  'contracts:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'contracts:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'contracts:delete': ['OWNER', 'ADMIN'],
  'contracts:export': ['OWNER', 'ADMIN', 'MEMBER'],

  // Member permissions
  'members:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'members:invite': ['OWNER', 'ADMIN'],
  'members:remove': ['OWNER', 'ADMIN'],
  'members:changeRole': ['OWNER'],

  // Workspace permissions
  'workspace:settings': ['OWNER', 'ADMIN'],
  'workspace:billing': ['OWNER'],
  'workspace:delete': ['OWNER'],
} as const;

export type Permission = keyof typeof WORKSPACE_PERMISSIONS;

export function hasPermission(
  role: WorkspaceRole,
  permission: Permission
): boolean {
  return WORKSPACE_PERMISSIONS[permission].includes(role);
}
```

#### Step 3.2: Authorization Middleware
```typescript
// src/lib/workspaces/auth.ts
import { getSession } from '@/lib/auth';
import { hasPermission, Permission } from './permissions';

export async function requireWorkspacePermission(
  workspaceId: string,
  permission: Permission
) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const membership = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error('Not a member of this workspace');
  }

  if (!hasPermission(membership.role, permission)) {
    throw new Error('Insufficient permissions');
  }

  return { session, membership };
}

// Usage in API route
export async function POST(request: Request) {
  const { workspaceId } = await request.json();

  const { membership } = await requireWorkspacePermission(
    workspaceId,
    'contracts:create'
  );

  // Proceed with creating contract...
}
```

### Phase 4: API Routes (8 hours)

#### Step 4.1: Workspace CRUD
```typescript
// src/app/api/workspaces/route.ts
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaces = await getUserWorkspaces(session.user.id);
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  const workspace = await createWorkspace(session.user.id, name);

  return NextResponse.json({ workspace }, { status: 201 });
}
```

#### Step 4.2: Member Management
```typescript
// src/app/api/workspaces/[id]/members/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireWorkspacePermission(params.id, 'members:read');

  const members = await prisma.workspaceMembership.findMany({
    where: { workspaceId: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json({ members });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireWorkspacePermission(params.id, 'members:invite');

  const { email, role } = await request.json();
  const session = await getSession();

  const invitation = await createInvitation(
    params.id,
    email,
    role,
    session.user.id
  );

  return NextResponse.json({ invitation }, { status: 201 });
}
```

#### Step 4.3: Workspace Contracts
```typescript
// src/app/api/workspaces/[id]/contracts/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireWorkspacePermission(params.id, 'contracts:read');

  const contracts = await prisma.contract.findMany({
    where: { workspaceId: params.id },
    include: {
      analysis: {
        select: { status: true, riskScore: true, contractType: true },
      },
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ contracts });
}
```

### Phase 5: UI Components (16 hours)

#### Step 5.1: Workspace Switcher
```typescript
// src/components/workspace/workspace-switcher.tsx
'use client';

import { useState } from 'react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useCurrentWorkspace } from '@/hooks/use-current-workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WorkspaceSwitcher() {
  const { workspaces } = useWorkspaces();
  const { current, setCurrent } = useCurrentWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2">
        <BuildingIcon className="h-4 w-4" />
        <span>{current?.name || 'Personal'}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setCurrent(null)}>
          <UserIcon className="h-4 w-4 mr-2" />
          Personal
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => setCurrent(workspace)}
          >
            <BuildingIcon className="h-4 w-4 mr-2" />
            {workspace.name}
            <span className="ml-auto text-xs text-muted">
              {workspace.role}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => openCreateModal()}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### Step 5.2: Team Members Page
```typescript
// src/app/(dashboard)/workspace/[slug]/members/page.tsx
export default async function MembersPage({
  params,
}: {
  params: { slug: string };
}) {
  const workspace = await getWorkspaceBySlug(params.slug);
  const session = await getSession();
  const membership = workspace.members.find(
    (m) => m.userId === session?.user?.id
  );

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        {hasPermission(membership?.role, 'members:invite') && (
          <InviteMemberButton workspaceId={workspace.id} />
        )}
      </div>

      <MembersList
        members={workspace.members}
        currentUserRole={membership?.role}
        workspaceId={workspace.id}
      />

      <PendingInvitations workspaceId={workspace.id} />
    </div>
  );
}
```

#### Step 5.3: Workspace Settings
```typescript
// src/app/(dashboard)/workspace/[slug]/settings/page.tsx
export default async function SettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  // Require admin permission
  await requireWorkspacePermission(workspace.id, 'workspace:settings');

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <WorkspaceGeneralSettings workspace={workspace} />
        </TabsContent>

        <TabsContent value="billing">
          <WorkspaceBillingSettings workspace={workspace} />
        </TabsContent>

        <TabsContent value="danger">
          <WorkspaceDangerZone workspace={workspace} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Phase 6: Team Billing (8 hours)

#### Step 6.1: Team Pricing
```typescript
// src/lib/stripe/team-pricing.ts
export const TEAM_PLANS = {
  TEAM_MONTHLY: {
    name: 'Team',
    priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    price: 49,
    interval: 'month',
    maxMembers: 5,
    analysesLimit: 100,
  },
  TEAM_YEARLY: {
    name: 'Team (Annual)',
    priceId: process.env.STRIPE_PRICE_TEAM_YEARLY,
    price: 490,
    interval: 'year',
    maxMembers: 5,
    analysesLimit: 100,
  },
  BUSINESS_MONTHLY: {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    price: 199,
    interval: 'month',
    maxMembers: 20,
    analysesLimit: 500,
  },
  BUSINESS_YEARLY: {
    name: 'Business (Annual)',
    priceId: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    price: 1990,
    interval: 'year',
    maxMembers: 20,
    analysesLimit: 500,
  },
};
```

#### Step 6.2: Team Checkout
```typescript
// src/app/api/workspaces/[id]/billing/checkout/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireWorkspacePermission(params.id, 'workspace:billing');

  const { plan } = await request.json();
  const planConfig = TEAM_PLANS[plan];

  if (!planConfig) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
  });

  // Create or get Stripe customer
  let customerId = workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { workspaceId: params.id },
    });
    customerId = customer.id;
    await prisma.workspace.update({
      where: { id: params.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `https://clausify.app/workspace/${workspace.slug}/settings?success=true`,
    cancel_url: `https://clausify.app/workspace/${workspace.slug}/settings?canceled=true`,
    metadata: {
      workspaceId: params.id,
      plan,
    },
  });

  return NextResponse.json({ url: session.url });
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('Workspace Permissions', () => {
  it('should allow owner to delete workspace', () => {
    expect(hasPermission('OWNER', 'workspace:delete')).toBe(true);
  });

  it('should not allow member to delete workspace', () => {
    expect(hasPermission('MEMBER', 'workspace:delete')).toBe(false);
  });
});

describe('Invitation System', () => {
  it('should create and accept invitation', async () => {
    const invitation = await createInvitation(
      workspaceId,
      'new@example.com',
      'MEMBER',
      ownerId
    );

    const workspace = await acceptInvitation(invitation.token, newUserId);
    expect(workspace.id).toBe(workspaceId);
  });
});
```

### Integration Tests
- Full workspace lifecycle
- Permission enforcement
- Billing flow

### E2E Tests
- Create workspace
- Invite member
- Accept invitation
- Upload contract to workspace
- Role-based access

---

## Security Considerations

1. **Data Isolation:** Contracts belong to workspace OR user, never both
2. **Role Enforcement:** Check permissions on every action
3. **Invitation Security:** Time-limited, single-use tokens
4. **Audit Trail:** Log all permission changes
5. **Owner Protection:** Cannot remove last owner

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Team Signups | 50 teams in 3 months |
| Avg Team Size | 4+ members |
| Team Revenue | 40% of total |
| Team Retention | 90% (vs 70% individual) |

---

## Deliverables Checklist

### Database
- [ ] Workspace model
- [ ] Membership model
- [ ] Invitation model
- [ ] Contract workspace relation
- [ ] Migrations

### Backend
- [ ] Workspace CRUD
- [ ] Invitation system
- [ ] Permission system
- [ ] Member management
- [ ] Team billing

### Frontend
- [ ] Workspace switcher
- [ ] Create workspace flow
- [ ] Members page
- [ ] Settings page
- [ ] Invite flow
- [ ] Billing UI

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Permission tests
