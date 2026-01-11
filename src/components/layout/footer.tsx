'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FileText } from 'lucide-react';

export function Footer() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Clausify</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered contract analysis to help you understand legal
              documents in plain English.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/dashboard" className="hover:text-foreground">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/contracts" className="hover:text-foreground">
                      My Contracts
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/demo" className="hover:text-foreground">
                    Try Demo
                  </Link>
                </li>
              )}
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-foreground">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Clausify. All rights reserved.</p>
          <p className="mt-2">
            Clausify is not a law firm and does not provide legal advice. Consult
            a qualified attorney for legal matters.
          </p>
        </div>
      </div>
    </footer>
  );
}
