'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { FileUpload } from '@/components/forms/file-upload';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Contract, Analysis } from '@prisma/client';

type ContractWithAnalysis = Contract & {
  analysis: Pick<
    Analysis,
    'id' | 'status' | 'contractType' | 'riskScore' | 'summary' | 'createdAt'
  > | null;
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [contracts, setContracts] = useState<ContractWithAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userInfo, setUserInfo] = useState<{
    remainingAnalyses: number;
    plan: string;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('Payment successful! Your plan has been upgraded.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session) {
      fetchContracts();
      fetchUserInfo();
    }
  }, [session]);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data.contracts);
    } catch (error) {
      toast.error('Failed to load contracts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user info');
      const data = await response.json();
      setUserInfo({
        remainingAnalyses: data.user.remainingAnalyses,
        plan: data.user.plan,
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload');
      }

      const data = await response.json();
      toast.success('Contract uploaded successfully!');

      // Start analysis
      router.push(`/contracts/${data.contractId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload contract'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setContracts(contracts.filter((c) => c.id !== contractId));
      toast.success('Contract deleted');
    } catch (error) {
      toast.error('Failed to delete contract');
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Upload and analyze your contracts
            </p>
          </div>
          {userInfo && (
            <div className="text-right">
              <Badge variant={userInfo.plan === 'FREE' ? 'secondary' : 'default'}>
                {userInfo.plan.replace('_', ' ')}
              </Badge>
              <p className="mt-1 text-sm text-muted-foreground">
                {userInfo.remainingAnalyses} analyses remaining
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Analysis
                </CardTitle>
                <CardDescription>
                  Upload a contract to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  progress={uploadProgress}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Compare Contracts
                </CardTitle>
                <CardDescription>
                  View two contracts side by side
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/compare">
                  <Button className="w-full" variant="outline">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Start Comparison
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Contracts</CardTitle>
                <CardDescription>
                  {contracts.length === 0
                    ? 'No contracts yet'
                    : `${contracts.length} contract${contracts.length === 1 ? '' : 's'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 font-medium">No contracts yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your first contract to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ContractCard({
  contract,
  onDelete,
}: {
  contract: ContractWithAnalysis;
  onDelete: (id: string) => void;
}) {
  const getStatusIcon = () => {
    switch (contract.status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ANALYZING':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getRiskBadge = () => {
    if (!contract.analysis?.riskScore) return null;
    const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'destructive',
    };
    return (
      <Badge variant={variants[contract.analysis.riskScore]}>
        {contract.analysis.riskScore} Risk
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center gap-4">
        {getStatusIcon()}
        <div>
          <h4 className="font-medium">{contract.fileName}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {new Date(contract.createdAt).toLocaleDateString()}
            </span>
            {contract.analysis?.contractType && (
              <>
                <span>&middot;</span>
                <span>{contract.analysis.contractType.replace('_', ' ')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {getRiskBadge()}

        <Link href={`/contracts/${contract.id}`}>
          <Button variant="ghost" size="sm">
            View
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contract</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this contract? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(contract.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
