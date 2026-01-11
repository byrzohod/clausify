import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  FileText,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
  Star,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                Trusted by 10,000+ users
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Understand Your Contracts in{' '}
                <span className="text-primary">60 Seconds</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                Upload any legal document and get a plain English explanation.
                Our AI identifies key terms, red flags, and obligations so you
                know exactly what you&apos;re signing.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Try Demo
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required. 2 free analyses included.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">How Clausify Works</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Three simple steps to understand any contract
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">1. Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Drop your PDF or DOCX contract. We support all standard
                  contract formats up to 10MB.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">2. Analyze</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI reads every clause and identifies key terms,
                  obligations, and potential issues.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">3. Understand</h3>
                <p className="text-sm text-muted-foreground">
                  Get a clear summary, risk assessment, and actionable insights
                  in plain English.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-muted/30 py-20">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="mb-6 text-3xl font-bold">
                  Stop Signing Contracts You Don&apos;t Understand
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Legal documents are intentionally complex. Clausify cuts
                  through the jargon and tells you what actually matters.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h4 className="font-medium">Identify Red Flags</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically spot clauses that could put you at risk or
                        disadvantage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h4 className="font-medium">Save Hours of Time</h4>
                      <p className="text-sm text-muted-foreground">
                        Get comprehensive analysis in under a minute instead of
                        hours of reading.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h4 className="font-medium">Your Data is Secure</h4>
                      <p className="text-sm text-muted-foreground">
                        Enterprise-grade encryption. We never share or sell your
                        documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-8 shadow-lg">
                <h3 className="mb-4 text-xl font-semibold">
                  What You&apos;ll Get
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Plain English summary</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Risk assessment score</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Key terms & obligations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Red flags & concerns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Negotiation suggestions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Section-by-section breakdown</span>
                  </li>
                </ul>
                <Link href="/signup" className="mt-6 block">
                  <Button className="w-full">Try For Free</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contract Types Section */}
        <section className="py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">
                Works With Any Contract Type
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                From employment agreements to NDAs, we&apos;ve got you covered
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {[
                'Employment',
                'NDA',
                'Lease',
                'Freelance',
                'Service',
                'Sales',
                'Partnership',
                'License',
                'Loan',
                'And More...',
              ].map((type) => (
                <div
                  key={type}
                  className="rounded-lg border bg-card p-4 text-center"
                >
                  <span className="font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Understand Your Contracts?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
              Join thousands of users who trust Clausify to help them make
              informed decisions about the contracts they sign.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
