import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Validate webhook secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('[Webhook] Signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Log received event
  console.log('[Webhook] Event received', {
    type: event.type,
    id: event.id,
    created: new Date(event.created * 1000).toISOString(),
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type', { type: event.type, id: event.id });
    }

    console.log('[Webhook] Event processed successfully', { type: event.type, id: event.id });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Handler error', {
      eventType: event.type,
      eventId: event.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as keyof typeof PLANS;

  if (!userId || !plan) {
    console.error('[Webhook] checkout.session.completed: Missing metadata', {
      sessionId: session.id,
      hasUserId: !!userId,
      hasPlan: !!plan,
    });
    return;
  }

  const planConfig = PLANS[plan];

  // Get customer ID
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

  // Get subscription ID for subscription payments
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  // Calculate subscription end date
  let subscriptionEnd: Date | null = null;
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    subscriptionEnd = new Date(subscription.current_period_end * 1000);
  } else {
    // For one-time payments, set end date to 1 year
    subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: plan,
      stripeCustomerId: customerId,
      subscriptionId: subscriptionId,
      subscriptionEnd,
      analysesLimit: planConfig.analyses,
      // Reset used count for new subscription
      analysesUsed: 0,
    },
  });

  console.log('[Webhook] checkout.session.completed: User upgraded successfully', {
    userId,
    plan,
    customerId,
    subscriptionId,
    subscriptionEnd: subscriptionEnd?.toISOString(),
    analysesLimit: planConfig.analyses,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('[Webhook] customer.subscription.updated: User not found', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });
    return;
  }

  console.log('[Webhook] customer.subscription.updated: Updating user', {
    userId: user.id,
    subscriptionId: subscription.id,
    newPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id },
  });

  if (!user) {
    console.error('[Webhook] customer.subscription.deleted: User not found', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });
    return;
  }

  console.log('[Webhook] customer.subscription.deleted: Downgrading user to FREE', {
    userId: user.id,
    subscriptionId: subscription.id,
    previousPlan: user.plan,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'FREE',
      subscriptionId: null,
      subscriptionEnd: null,
      analysesLimit: 2,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    console.log('[Webhook] invoice.payment_succeeded: No subscription (one-time payment)', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });
    return;
  }

  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription.id;

  const user = await prisma.user.findFirst({
    where: { subscriptionId },
  });

  if (!user) {
    console.error('[Webhook] invoice.payment_succeeded: User not found', {
      invoiceId: invoice.id,
      subscriptionId,
      customerId: invoice.customer,
    });
    return;
  }

  console.log('[Webhook] invoice.payment_succeeded: Resetting usage for user', {
    userId: user.id,
    invoiceId: invoice.id,
    subscriptionId,
  });

  // Reset monthly usage on successful payment
  await prisma.user.update({
    where: { id: user.id },
    data: {
      analysesUsed: 0,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    console.log('[Webhook] invoice.payment_failed: No subscription (one-time payment)', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });
    return;
  }

  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription.id;

  const user = await prisma.user.findFirst({
    where: { subscriptionId },
  });

  if (!user) {
    console.error('[Webhook] invoice.payment_failed: User not found', {
      invoiceId: invoice.id,
      subscriptionId,
      customerId: invoice.customer,
    });
    return;
  }

  console.warn('[Webhook] invoice.payment_failed: Payment failed for user', {
    userId: user.id,
    email: user.email,
    invoiceId: invoice.id,
    subscriptionId,
    attemptCount: invoice.attempt_count,
    amountDue: invoice.amount_due,
  });
}
