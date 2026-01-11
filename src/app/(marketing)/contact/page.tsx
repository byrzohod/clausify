import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { Mail, MessageSquare, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Contact Us - Clausify',
  description: 'Get in touch with the Clausify team',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="mb-8 text-4xl font-bold">Contact Us</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="mb-8 text-lg text-muted-foreground">
              Have questions, feedback, or need help? We&apos;d love to hear from you.
              Choose the best way to reach us below.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-6">
                <Mail className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">General Inquiries</h3>
                <p className="mb-4 text-muted-foreground">
                  For general questions about Clausify and our services.
                </p>
                <a
                  href="mailto:hello@clausify.com"
                  className="text-primary hover:underline"
                >
                  hello@clausify.com
                </a>
              </div>

              <div className="rounded-lg border p-6">
                <HelpCircle className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">Support</h3>
                <p className="mb-4 text-muted-foreground">
                  Need help with your account or a technical issue?
                </p>
                <a
                  href="mailto:support@clausify.com"
                  className="text-primary hover:underline"
                >
                  support@clausify.com
                </a>
              </div>

              <div className="rounded-lg border p-6">
                <MessageSquare className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">Feedback</h3>
                <p className="mb-4 text-muted-foreground">
                  Share your ideas on how we can improve Clausify.
                </p>
                <a
                  href="mailto:feedback@clausify.com"
                  className="text-primary hover:underline"
                >
                  feedback@clausify.com
                </a>
              </div>
            </div>

            <section className="mt-12">
              <h2 className="mb-4 text-2xl font-semibold">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    How long does analysis take?
                  </h3>
                  <p className="text-muted-foreground">
                    Most contracts are analyzed within 30-60 seconds. Longer
                    documents may take up to 2 minutes.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    What file types are supported?
                  </h3>
                  <p className="text-muted-foreground">
                    We currently support PDF and DOCX files up to 10MB in size.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    Is my data secure?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes. All uploads are encrypted in transit and at rest. We take
                    security seriously and follow industry best practices. See our{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{' '}
                    for details.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    Can I delete my contracts?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes, you can delete any contract and its analysis from your
                    dashboard at any time. The data will be permanently removed.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    Do you offer refunds?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes, we offer a 7-day money-back guarantee for paid plans. If
                    you&apos;re not satisfied, contact support for a full refund.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-12 rounded-lg border bg-muted/50 p-6">
              <h2 className="mb-4 text-2xl font-semibold">Response Time</h2>
              <p className="text-muted-foreground">
                We typically respond to emails within 24-48 hours during business
                days. For urgent issues, please include &quot;URGENT&quot; in your subject
                line.
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
