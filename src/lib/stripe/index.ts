import Stripe from 'stripe';

// Only initialize Stripe client if the secret key is available
// This allows the build to succeed without the env var
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : (null as unknown as Stripe);

export const PLANS = {
  PAY_PER_USE: {
    name: 'Pay Per Use',
    priceId: process.env.STRIPE_PAY_PER_USE_PRICE_ID,
    price: 4.99,
    analyses: 1,
    mode: 'payment' as const,
  },
  PRO_MONTHLY: {
    name: 'Pro Monthly',
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    price: 14.99,
    analyses: 20,
    mode: 'subscription' as const,
  },
  PRO_ANNUAL: {
    name: 'Pro Annual',
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    price: 119,
    analyses: 240,
    mode: 'subscription' as const,
  },
  TEAM: {
    name: 'Team',
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    price: 49,
    analyses: 100,
    mode: 'subscription' as const,
  },
};

export type PlanKey = keyof typeof PLANS;

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: PlanKey,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const planConfig = PLANS[plan];

  if (!planConfig.priceId) {
    throw new Error(`Price ID not configured for plan: ${plan}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    mode: planConfig.mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan,
    },
  });

  return session.url!;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}
