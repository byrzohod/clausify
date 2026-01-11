'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { DualFileUpload } from '@/components/forms/dual-file-upload';
import { ComparisonView } from '@/components/comparison/comparison-view';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import type { ComparisonContract } from '@/types';

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [leftContract, setLeftContract] = useState<ComparisonContract | null>(null);
  const [rightContract, setRightContract] = useState<ComparisonContract | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  const handleFilesSelected = (left: File | null, right: File | null) => {
    setLeftFile(left);
    setRightFile(right);
    // Reset contracts when files change
    if (!left) setLeftContract(null);
    if (!right) setRightContract(null);
  };

  const parseFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/contracts/parse', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse file');
    }

    const data = await response.json();
    return data.text;
  };

  const handleCompare = async () => {
    if (!leftFile || !rightFile) return;

    setIsComparing(true);

    try {
      const [leftText, rightText] = await Promise.all([
        parseFile(leftFile),
        parseFile(rightFile),
      ]);

      setLeftContract({
        id: crypto.randomUUID(),
        fileName: leftFile.name,
        text: leftText,
        uploadedAt: new Date(),
      });

      setRightContract({
        id: crypto.randomUUID(),
        fileName: rightFile.name,
        text: rightText,
        uploadedAt: new Date(),
      });

      toast.success('Contracts parsed successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to compare contracts'
      );
    } finally {
      setIsComparing(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Compare Contracts</h1>
          <p className="text-muted-foreground">
            Upload two contracts to view them side by side
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Upload Contracts
            </CardTitle>
            <CardDescription>
              Select two contracts to compare. Supported formats: PDF, DOCX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DualFileUpload
              onFilesSelected={handleFilesSelected}
              onCompare={handleCompare}
              isComparing={isComparing}
              leftLabel="First Contract"
              rightLabel="Second Contract"
            />
          </CardContent>
        </Card>

        <ComparisonView
          left={leftContract}
          right={rightContract}
          isLoading={isComparing}
          leftLabel="First Contract"
          rightLabel="Second Contract"
        />
      </main>
    </div>
  );
}
