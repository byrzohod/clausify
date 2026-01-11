import { Header } from '@/components/layout/header';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Clausify',
  description: 'Terms of Service for using Clausify AI Contract Analyzer',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
          <p className="mb-6 text-muted-foreground">
            Last updated: January 2024
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                1. Acceptance of Terms
              </h2>
              <p className="mb-4 text-muted-foreground">
                By accessing or using Clausify (&quot;the Service&quot;), you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                2. Description of Service
              </h2>
              <p className="mb-4 text-muted-foreground">
                Clausify is an AI-powered contract analysis tool that helps
                users understand legal documents. The Service provides
                summaries, key term identification, obligation tracking, and
                risk assessment for uploaded contracts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                3. Important Disclaimers
              </h2>
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <p className="mb-2 font-semibold text-yellow-600 dark:text-yellow-400">
                  Not Legal Advice
                </p>
                <p className="text-muted-foreground">
                  Clausify is NOT a substitute for professional legal advice.
                  The analysis provided is for informational purposes only and
                  should not be relied upon as legal counsel. Always consult
                  with a qualified attorney for legal matters.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">4. User Accounts</h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  You must provide accurate and complete registration
                  information
                </li>
                <li>
                  You are responsible for maintaining the security of your
                  account
                </li>
                <li>
                  You must notify us immediately of any unauthorized access
                </li>
                <li>One person or entity per account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">5. Acceptable Use</h2>
              <p className="mb-4 text-muted-foreground">You agree NOT to:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Upload malicious files or content</li>
                <li>Attempt to reverse engineer the Service</li>
                <li>Use the Service for any illegal purpose</li>
                <li>Share your account credentials with others</li>
                <li>Exceed your plan&apos;s usage limits through automation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                6. Intellectual Property
              </h2>
              <p className="mb-4 text-muted-foreground">
                You retain all rights to the documents you upload. Clausify does
                not claim ownership of your content. However, you grant us a
                limited license to process your documents for the purpose of
                providing the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                7. Payment and Refunds
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Paid plans are billed in advance</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Refunds are provided at our discretion</li>
                <li>
                  You can cancel your subscription at any time via the billing
                  portal
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                8. Limitation of Liability
              </h2>
              <p className="mb-4 text-muted-foreground">
                To the maximum extent permitted by law, Clausify shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, or any loss of data, use,
                goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                9. Changes to Terms
              </h2>
              <p className="mb-4 text-muted-foreground">
                We reserve the right to modify these terms at any time. We will
                notify users of significant changes via email or through the
                Service. Continued use after changes constitutes acceptance of
                the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">10. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, please contact us at{' '}
                <a
                  href="mailto:legal@clausify.com"
                  className="text-primary hover:underline"
                >
                  legal@clausify.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 border-t pt-8">
            <Link href="/" className="text-primary hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
