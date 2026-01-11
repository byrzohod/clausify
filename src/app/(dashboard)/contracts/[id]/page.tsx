'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
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
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { AnalysisResult } from '@/types';
import type { Contract, Analysis } from '@prisma/client';
import { exportAnalysisToPdf, downloadPdf } from '@/lib/export';

type ContractWithAnalysis = Contract & {
  analysis: Analysis | null;
};

export default function ContractPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [contract, setContract] = useState<ContractWithAnalysis | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  // Fetch contract and handle analysis state
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sessionStatus]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch contract');
      }
      const data = await response.json();
      setContract(data.contract);

      // If analysis is complete, parse the result
      if (data.contract.analysis?.status === 'COMPLETED') {
        setAnalysisResult({
          summary: data.contract.analysis.summary,
          contractType: data.contract.analysis.contractType,
          riskScore: data.contract.analysis.riskScore,
          keyTerms: data.contract.analysis.keyTerms || [],
          obligations: data.contract.analysis.obligations || [],
          redFlags: data.contract.analysis.redFlags || [],
          sections: data.contract.analysis.sections || [],
          parties: data.contract.analysis.parties || [],
          dates: data.contract.analysis.dates || [],
          amounts: data.contract.analysis.amounts || [],
        });
      } else if (
        data.contract.status === 'UPLOADED' ||
        data.contract.status === 'PENDING'
      ) {
        // Auto-start analysis
        startAnalysis();
      } else if (data.contract.analysis?.status === 'PROCESSING') {
        // Poll for completion
        pollAnalysisStatus();
      }
    } catch (error) {
      setError('Failed to load contract');
      toast.error('Failed to load contract');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    // Simulate progress with cap at 85% until actually complete
    // This prevents the deceptive 90%+ progress that might never complete
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 85) {
          // Cap at 85% - honest progress indication
          return 85;
        }
        // Slower progress as we approach the cap
        const remaining = 85 - prev;
        const increment = Math.min(remaining * 0.1, Math.random() * 8);
        return prev + increment;
      });
    }, 800);

    try {
      const response = await fetch(`/api/analyze/${id}`, {
        method: 'POST',
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await response.json();

      if (data.status === 'COMPLETED' && data.result) {
        // Only show 100% when actually complete
        setAnalysisProgress(100);
        setAnalysisResult(data.result);
        toast.success('Analysis complete!');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed');
      toast.error(
        error instanceof Error ? error.message : 'Failed to analyze contract'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pollAnalysisStatus = async () => {
    setIsAnalyzing(true);
    let pollCount = 0;
    const maxPolls = 60; // Max 2 minutes of polling

    const poll = async () => {
      pollCount++;

      try {
        const response = await fetch(`/api/analyze/${id}`);
        const data = await response.json();

        if (data.status === 'COMPLETED' && data.result) {
          setAnalysisProgress(100);
          setAnalysisResult(data.result);
          setIsAnalyzing(false);
          toast.success('Analysis complete!');
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Analysis failed');
          setIsAnalyzing(false);
        } else if (pollCount >= maxPolls) {
          setError('Analysis is taking longer than expected. Please refresh the page.');
          setIsAnalyzing(false);
        } else {
          // Exponential backoff: 2s, 3s, 4s, 5s, then cap at 5s
          const delay = Math.min(2000 + pollCount * 500, 5000);
          setTimeout(poll, delay);
        }
      } catch (error) {
        setError('Failed to check analysis status');
        setIsAnalyzing(false);
      }
    };

    poll();
  };

  const handleExport = async () => {
    if (!analysisResult || !contract) {
      toast.error('No analysis to export');
      return;
    }

    try {
      toast.info('Generating PDF...');
      const blob = await exportAnalysisToPdf(analysisResult, contract.fileName);
      downloadPdf(blob, contract.fileName);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
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
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {isAnalyzing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Contract
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

        {error && !isAnalyzing && (
          <Card className="mb-8 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Analysis Failed
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={startAnalysis}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <AnalysisResults
            analysis={analysisResult}
            fileName={contract?.fileName}
            onExport={handleExport}
          />
        )}
      </main>
    </div>
  );
}
