import { AuthForm } from '@/components/forms/auth-form';
import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Clausify</span>
            </Link>
          </div>
          <AuthForm mode="login" />
        </div>
      </main>
    </div>
  );
}
