'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { FileUpload } from '@/components/forms/file-upload';
import { AnalysisResults } from '@/components/analysis';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ArrowRight, Lock, FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import type { AnalysisResult } from '@/types';
import { SAMPLE_NDA_ANALYSIS } from '@/lib/ai/sample-analysis';

export default function DemoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [remainingAnalyses, setRemainingAnalyses] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setIsAnalyzing(false);
    setError(null);
    setAnalysisResult(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 100));
      }, 100);

      setIsUploading(false);
      setIsAnalyzing(true);
      clearInterval(uploadInterval);
      setUploadProgress(100);

      // Start analysis progress
      const analysisInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(analysisInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch('/api/demo', {
        method: 'POST',
        body: formData,
      });

      clearInterval(analysisInterval);
      setAnalysisProgress(100);

      const data = await response.json();

      if (!response.ok) {
        // Check if authentication is required
        if (data.requiresAuth) {
          router.push('/login?callbackUrl=/demo');
          return;
        }
        // Check if upgrade is required
        if (data.upgradeRequired) {
          toast.error(data.error);
          router.push('/pricing');
          return;
        }
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.status === 'COMPLETED' && data.result) {
        setAnalysisResult(data.result);
        setRemainingAnalyses(data.remainingAnalyses);
        toast.success(data.message || 'Demo analysis complete!');
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to analyze contract'
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to analyze contract'
      );
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated - show sample analysis option and login prompt
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold">See Clausify in Action</h1>
              <p className="text-lg text-muted-foreground">
                View a sample analysis to see exactly what you get, or sign up for free to analyze your own contracts.
              </p>
            </div>

            {/* Sample Analysis View */}
            {analysisResult ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div>
                    <h3 className="font-medium">Sample NDA Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      This is what your analysis will look like
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setAnalysisResult(null)}
                  >
                    Back to Demo
                  </Button>
                </div>

                <AnalysisResults
                  analysis={analysisResult}
                  fileName="Sample NDA Contract.pdf"
                />

                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="flex items-center justify-between py-6">
                    <div>
                      <h3 className="font-semibold">Ready to analyze your own contract?</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign up free and get 2 contract analyses at no cost.
                      </p>
                    </div>
                    <Link href="/signup?callbackUrl=/demo">
                      <Button>
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sample Analysis Card */}
                <Card className="border-2 border-primary/50">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">View Sample Analysis</CardTitle>
                    <CardDescription>
                      See what a full contract analysis looks like before signing up
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Sample NDA Contract</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A typical Non-Disclosure Agreement with detailed analysis including red flags, key terms, and obligations.
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setAnalysisResult(SAMPLE_NDA_ANALYSIS)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Sample Analysis
                    </Button>
                  </CardContent>
                </Card>

                {/* Sign Up Card */}
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Analyze Your Contract</CardTitle>
                    <CardDescription>
                      Create a free account to analyze your own contracts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="mb-2 font-medium">Free Account Includes</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>- 2 free contract analyses</li>
                        <li>- Save and access results anytime</li>
                        <li>- Export to PDF</li>
                        <li>- No credit card required</li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link href="/signup?callbackUrl=/demo" className="w-full">
                        <Button className="w-full">
                          Create Free Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/login?callbackUrl=/demo" className="w-full">
                        <Button variant="ghost" className="w-full">
                          Already have an account? Sign In
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">Try Clausify</h1>
            <p className="text-lg text-muted-foreground">
              Upload any contract and see our AI analysis in action.
              {remainingAnalyses !== null && (
                <span className="block mt-1 text-sm">
                  You have {remainingAnalyses} free analysis{remainingAnalyses !== 1 ? 'es' : ''} remaining.
                </span>
              )}
            </p>
          </div>

          {!analysisResult && !isAnalyzing && (
            <Card className="mx-auto max-w-xl">
              <CardHeader>
                <CardTitle>Upload a Contract</CardTitle>
                <CardDescription>
                  Drop your PDF or DOCX file to analyze (max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  progress={uploadProgress}
                  maxSize={5 * 1024 * 1024}
                />

                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-2 font-medium">What You Get</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>- Plain English summary of your contract</li>
                    <li>- Key terms and obligations identified</li>
                    <li>- Red flags and risk assessment</li>
                    <li>- Important dates and deadlines</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {isAnalyzing && (
            <Card className="mx-auto max-w-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing Your Contract
                </CardTitle>
                <CardDescription>
                  Our AI is reading through your contract. This usually takes
                  30-60 seconds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={analysisProgress} className="h-2" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysisProgress < 30
                    ? 'Extracting text from document...'
                    : analysisProgress < 60
                      ? 'Analyzing contract terms...'
                      : analysisProgress < 90
                        ? 'Identifying key obligations and red flags...'
                        : 'Finalizing analysis...'}
                </p>
              </CardContent>
            </Card>
          )}

          {analysisResult && (
            <>
              {remainingAnalyses === 0 && (
                <div className="mb-6 rounded-lg border border-amber-500 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-amber-600">
                        You&apos;ve used all your free analyses
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upgrade to Pro for unlimited contract analyses
                      </p>
                    </div>
                    <Link href="/pricing">
                      <Button>
                        Upgrade to Pro
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <AnalysisResults analysis={analysisResult} fileName="Contract Analysis" />

              {remainingAnalyses !== null && remainingAnalyses > 0 && (
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAnalysisResult(null);
                      setAnalysisProgress(0);
                    }}
                  >
                    Analyze Another Contract ({remainingAnalyses} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
