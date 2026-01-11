'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { AnalysisResult } from '@/types';

export default function DemoPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await response.json();

      if (data.status === 'COMPLETED' && data.result) {
        setAnalysisResult(data.result);
        toast.success('Demo analysis complete!');
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">Try Clausify Demo</h1>
            <p className="text-lg text-muted-foreground">
              Upload any contract and see our AI analysis in action. No account
              required.
            </p>
          </div>

          {!analysisResult && !isAnalyzing && (
            <Card className="mx-auto max-w-xl">
              <CardHeader>
                <CardTitle>Upload a Contract</CardTitle>
                <CardDescription>
                  Drop your PDF or DOCX file to try our analysis (max 5MB)
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
                  <h4 className="mb-2 font-medium">Demo Limitations</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>- Maximum file size: 5MB</li>
                    <li>- 1 demo analysis per hour per IP</li>
                    <li>- Results are not saved</li>
                  </ul>
                  <p className="mt-3 text-sm">
                    <Link
                      href="/signup"
                      className="font-medium text-primary hover:underline"
                    >
                      Sign up for free
                    </Link>{' '}
                    to save your analyses and get 2 free reviews.
                  </p>
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
              <div className="mb-6 rounded-lg border border-primary bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">
                      Demo Analysis Complete
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sign up to save your analyses and get 2 free reviews
                    </p>
                  </div>
                  <Link href="/signup">
                    <Button>
                      Sign Up Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <AnalysisResults analysis={analysisResult} fileName="Demo Contract" />

              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysisResult(null);
                    setAnalysisProgress(0);
                  }}
                >
                  Analyze Another Contract
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
