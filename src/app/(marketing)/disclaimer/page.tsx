import { Header } from '@/components/layout/header';
import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer - Clausify',
  description: 'Legal disclaimer for Clausify AI Contract Analyzer',
};

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-12">
          <h1 className="mb-8 text-4xl font-bold">Disclaimer</h1>
          <p className="mb-6 text-muted-foreground">Last updated: January 2024</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8 rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
              <h2 className="mb-4 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                Not Legal Advice
              </h2>
              <p className="text-muted-foreground">
                <strong>CLAUSIFY IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL ADVICE.</strong>
              </p>
              <p className="mt-4 text-muted-foreground">
                The information and analysis provided by Clausify is for
                informational and educational purposes only. It is not intended to
                be, and should not be construed as, legal advice, legal opinion, or
                legal services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                1. AI-Generated Analysis
              </h2>
              <p className="mb-4 text-muted-foreground">
                Clausify uses artificial intelligence to analyze contracts and
                provide summaries, key term identification, and risk assessments.
                While we strive for accuracy:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  AI-generated analysis may contain errors, omissions, or
                  misinterpretations
                </li>
                <li>
                  The analysis is based on the text provided and may not capture the
                  full legal context
                </li>
                <li>
                  Legal language can be nuanced and subject to interpretation by
                  courts
                </li>
                <li>
                  Laws vary by jurisdiction and may affect how contract terms are
                  enforced
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                2. Consult a Qualified Attorney
              </h2>
              <p className="mb-4 text-muted-foreground">
                For any legal matters, including but not limited to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Contract negotiation or modification</li>
                <li>Understanding your legal rights and obligations</li>
                <li>Making decisions with legal consequences</li>
                <li>Disputes or potential litigation</li>
                <li>Employment, business, or real estate transactions</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                <strong>
                  You should consult with a qualified attorney licensed in your
                  jurisdiction.
                </strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                3. No Attorney-Client Relationship
              </h2>
              <p className="text-muted-foreground">
                Use of Clausify does not create an attorney-client relationship
                between you and Clausify, its owners, employees, or any other party.
                No confidentiality or privilege attaches to any communications with
                Clausify.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">4. Limitation of Liability</h2>
              <p className="mb-4 text-muted-foreground">
                To the fullest extent permitted by law:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Clausify provides its services &quot;as is&quot; without any warranty,
                  express or implied
                </li>
                <li>
                  We are not liable for any damages arising from your use of or
                  reliance on our analysis
                </li>
                <li>
                  We are not responsible for any decisions you make based on our
                  analysis
                </li>
                <li>
                  Our total liability is limited to the amount you paid for our
                  services
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">5. Accuracy of Information</h2>
              <p className="text-muted-foreground">
                While we use advanced AI technology and make reasonable efforts to
                provide accurate analysis, we cannot guarantee the accuracy,
                completeness, or reliability of any information provided. Contract
                analysis requires professional judgment that AI cannot fully
                replicate.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                6. User Responsibility
              </h2>
              <p className="mb-4 text-muted-foreground">By using Clausify, you agree that:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  You will not rely solely on Clausify for legal decisions
                </li>
                <li>
                  You understand our analysis is for informational purposes only
                </li>
                <li>
                  You are responsible for seeking appropriate legal counsel when
                  needed
                </li>
                <li>
                  You have read and understand this disclaimer
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">7. Third-Party Content</h2>
              <p className="text-muted-foreground">
                Clausify may include links to third-party websites or content. We do
                not endorse and are not responsible for any third-party content,
                products, or services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">8. Changes to Disclaimer</h2>
              <p className="text-muted-foreground">
                We may update this disclaimer at any time. Continued use of Clausify
                after changes constitutes acceptance of the updated disclaimer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">9. Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about this disclaimer, please contact us at{' '}
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
