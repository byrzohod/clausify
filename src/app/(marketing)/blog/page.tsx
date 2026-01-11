import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { Newspaper, Bell } from 'lucide-react';

export const metadata = {
  title: 'Blog - Clausify',
  description: 'Insights on contracts, legal tech, and AI-powered analysis',
};

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="mb-8 text-4xl font-bold">Blog</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="rounded-lg border p-8 text-center">
              <Newspaper className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-4 text-2xl font-semibold">Coming Soon</h2>
              <p className="mb-6 text-muted-foreground">
                We&apos;re working on creating valuable content about contract analysis,
                legal tips, and how to protect yourself when signing agreements.
              </p>
              <p className="text-muted-foreground">
                In the meantime, check out our{' '}
                <Link href="/demo" className="text-primary hover:underline">
                  demo
                </Link>{' '}
                to see Clausify in action.
              </p>
            </div>

            <section className="mt-12">
              <h2 className="mb-4 text-2xl font-semibold">
                Topics We&apos;ll Cover
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Understanding common contract clauses</li>
                <li>Red flags to watch for in employment contracts</li>
                <li>Negotiating better terms in freelance agreements</li>
                <li>What to look for in rental leases</li>
                <li>How AI is transforming legal document analysis</li>
                <li>Tips for protecting your intellectual property</li>
                <li>Non-compete clause explained</li>
                <li>Understanding indemnification clauses</li>
              </ul>
            </section>

            <section className="mt-12 rounded-lg border bg-muted/50 p-6">
              <div className="flex items-center gap-4">
                <Bell className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Get Notified</h3>
                  <p className="text-muted-foreground">
                    Follow us on social media or check back soon for updates. We&apos;ll
                    be publishing our first articles very soon.
                  </p>
                </div>
              </div>
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
