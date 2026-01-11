import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { FileText, Shield, Zap, Users } from 'lucide-react';

export const metadata = {
  title: 'About Us - Clausify',
  description: 'Learn about Clausify - AI-powered contract analysis for everyone',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="mb-8 text-4xl font-bold">About Clausify</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold">Our Mission</h2>
              <p className="mb-4 text-lg text-muted-foreground">
                Clausify is on a mission to democratize access to contract
                understanding. We believe everyone deserves to know exactly what
                they&apos;re signing, without needing a law degree or expensive
                legal fees.
              </p>
              <p className="text-muted-foreground">
                Every day, millions of people sign contracts they don&apos;t fully
                understand. Whether it&apos;s an employment agreement, a lease, or a
                freelance contract, the complexity of legal language creates a
                barrier that can lead to unfavorable terms and unexpected
                obligations.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-semibold">What We Do</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border p-6">
                  <FileText className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">
                    Plain English Analysis
                  </h3>
                  <p className="text-muted-foreground">
                    We transform complex legal jargon into clear, understandable
                    summaries that anyone can comprehend.
                  </p>
                </div>
                <div className="rounded-lg border p-6">
                  <Shield className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">Risk Identification</h3>
                  <p className="text-muted-foreground">
                    Our AI identifies potential red flags and unfavorable terms that
                    could affect your interests.
                  </p>
                </div>
                <div className="rounded-lg border p-6">
                  <Zap className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">Fast Results</h3>
                  <p className="text-muted-foreground">
                    Get comprehensive contract analysis in minutes, not hours or
                    days waiting for legal review.
                  </p>
                </div>
                <div className="rounded-lg border p-6">
                  <Users className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">For Everyone</h3>
                  <p className="text-muted-foreground">
                    Whether you&apos;re a freelancer, employee, or small business owner,
                    Clausify makes contract analysis accessible.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold">How It Works</h2>
              <ol className="list-decimal space-y-4 pl-6 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Upload your contract</strong> -
                  Simply upload a PDF or DOCX file of your contract.
                </li>
                <li>
                  <strong className="text-foreground">AI Analysis</strong> - Our
                  advanced AI reads and analyzes every clause and provision.
                </li>
                <li>
                  <strong className="text-foreground">Get Your Report</strong> -
                  Receive a comprehensive breakdown including summary, key terms,
                  obligations, and potential concerns.
                </li>
                <li>
                  <strong className="text-foreground">Make Informed Decisions</strong>{' '}
                  - Use the insights to negotiate better terms or understand what
                  you&apos;re agreeing to.
                </li>
              </ol>
            </section>

            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-semibold">Our Technology</h2>
              <p className="mb-4 text-muted-foreground">
                Clausify is powered by Claude, Anthropic&apos;s advanced AI assistant.
                Claude excels at understanding nuanced language and providing
                thoughtful, detailed analysis of complex documents.
              </p>
              <p className="text-muted-foreground">
                We&apos;ve fine-tuned our prompts and analysis pipeline specifically
                for contract review, ensuring you get accurate, relevant insights
                for each type of agreement.
              </p>
            </section>

            <section className="mb-8 rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
              <h2 className="mb-4 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                Important Note
              </h2>
              <p className="text-muted-foreground">
                Clausify is not a law firm and does not provide legal advice. Our
                AI-powered analysis is designed to help you understand contracts
                better, but it should not replace professional legal counsel for
                important decisions. Always consult a qualified attorney when you
                need legal advice.
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
