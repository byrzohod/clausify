import { Header } from '@/components/layout/header';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Clausify',
  description: 'Privacy Policy for Clausify AI Contract Analyzer',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
          <p className="mb-6 text-muted-foreground">
            Last updated: January 2024
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
              <p className="mb-4 text-muted-foreground">
                At Clausify, we take your privacy seriously. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our AI-powered contract analysis
                service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                2. Information We Collect
              </h2>

              <h3 className="mb-2 mt-4 text-xl font-medium">
                Account Information
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Name (optional)</li>
                <li>Billing information (processed by Stripe)</li>
              </ul>

              <h3 className="mb-2 mt-4 text-xl font-medium">
                Documents You Upload
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Contract files (PDF, DOCX)</li>
                <li>Extracted text content</li>
                <li>Analysis results</li>
              </ul>

              <h3 className="mb-2 mt-4 text-xl font-medium">Usage Data</h3>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and features used</li>
                <li>Time and date of access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>To provide and maintain the Service</li>
                <li>To process your documents and generate analyses</li>
                <li>To manage your account and subscriptions</li>
                <li>To send important service updates</li>
                <li>To improve and optimize the Service</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                4. Document Security
              </h2>
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <p className="mb-2 font-semibold text-green-600 dark:text-green-400">
                  Your Documents Are Protected
                </p>
                <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                  <li>All uploads are encrypted in transit (TLS/SSL)</li>
                  <li>Documents are stored securely in encrypted storage</li>
                  <li>Access is restricted to authorized personnel only</li>
                  <li>
                    We do not share your documents with third parties except as
                    needed for AI processing
                  </li>
                  <li>You can delete your documents at any time</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                5. AI Processing
              </h2>
              <p className="mb-4 text-muted-foreground">
                Your documents are processed using Claude AI by Anthropic. When
                you upload a document:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  The text content is sent to Claude for analysis
                </li>
                <li>
                  Anthropic does not use your data to train their models (per
                  their API terms)
                </li>
                <li>Analysis results are stored in our database</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                6. Third-Party Services
              </h2>
              <p className="mb-4 text-muted-foreground">
                We use the following third-party services:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  <strong>Supabase:</strong> Database and file storage
                </li>
                <li>
                  <strong>Anthropic (Claude):</strong> AI contract analysis
                </li>
                <li>
                  <strong>Stripe:</strong> Payment processing
                </li>
                <li>
                  <strong>Vercel:</strong> Hosting and analytics
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                Each service has its own privacy policy governing their use of
                data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                7. Data Retention
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Account data is retained while your account is active
                </li>
                <li>
                  Uploaded documents and analyses are retained until you delete
                  them
                </li>
                <li>
                  You can request complete data deletion by contacting us
                </li>
                <li>
                  Backups may retain data for up to 30 days after deletion
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">8. Your Rights</h2>
              <p className="mb-4 text-muted-foreground">You have the right to:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data and account</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">9. Cookies</h2>
              <p className="mb-4 text-muted-foreground">
                We use essential cookies to maintain your session and
                preferences. We may use analytics cookies to understand how you
                use our Service. You can control cookies through your browser
                settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                10. Children&apos;s Privacy
              </h2>
              <p className="mb-4 text-muted-foreground">
                Our Service is not intended for users under the age of 18. We do
                not knowingly collect information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                11. Changes to This Policy
              </h2>
              <p className="mb-4 text-muted-foreground">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">12. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact
                us at{' '}
                <a
                  href="mailto:privacy@clausify.com"
                  className="text-primary hover:underline"
                >
                  privacy@clausify.com
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
