'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out Clausify',
    features: [
      '2 contract analyses',
      'Basic analysis features',
      'PDF & DOCX support',
      'Risk assessment',
      'Key terms identification',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'PAY_PER_USE',
    name: 'Pay Per Use',
    price: 4.99,
    period: 'per analysis',
    description: 'For occasional contract reviews',
    features: [
      '1 contract analysis',
      'Full analysis features',
      'PDF export',
      'Priority processing',
      'No expiration',
    ],
    cta: 'Buy Now',
    popular: false,
  },
  {
    id: 'PRO_MONTHLY',
    name: 'Pro',
    price: 14.99,
    period: 'per month',
    description: 'For professionals who review contracts regularly',
    features: [
      '20 analyses per month',
      'Full analysis features',
      'PDF export',
      'Priority support',
      'Analysis history',
      'Cancel anytime',
    ],
    cta: 'Subscribe',
    popular: true,
  },
  {
    id: 'PRO_ANNUAL',
    name: 'Pro Annual',
    price: 119,
    period: 'per year',
    description: 'Best value - save 2 months',
    features: [
      '240 analyses per year',
      'Everything in Pro Monthly',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Subscribe',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      toast.info('Payment cancelled');
    }
  }, [searchParams]);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push('/signup');
      return;
    }

    if (planId === 'FREE') {
      router.push('/dashboard');
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process payment'
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Choose the plan that works best for you. All plans include our
              core AI analysis features.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular ? 'border-primary shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="mb-4 text-2xl font-bold">Need More?</h2>
            <p className="mb-6 text-muted-foreground">
              For teams and enterprises with higher volume needs, contact us for
              custom pricing.
            </p>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>

          <div className="mt-16 rounded-lg border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">
                  What counts as one analysis?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Each contract you upload and analyze counts as one analysis.
                  Re-viewing an existing analysis does not count.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You&apos;ll
                  keep access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  What file formats do you support?
                </h3>
                <p className="text-sm text-muted-foreground">
                  We support PDF and DOCX files up to 10MB. Scanned documents
                  may have limited accuracy.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! We use enterprise-grade encryption and never share or
                  sell your documents. Files are automatically deleted after 30
                  days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
