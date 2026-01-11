'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, CreditCard, User, LogOut } from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  analysesUsed: number;
  analysesLimit: number;
  remainingAnalyses: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session) {
      fetchUserInfo();
    }
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user info');
      const data = await response.json();
      setUserInfo(data.user);
    } catch (error) {
      toast.error('Failed to load user info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 404) {
          toast.info('No billing information found. Upgrade your plan first.');
          router.push('/pricing');
          return;
        }
        throw new Error(data.error);
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to open billing portal');
    } finally {
      setIsLoadingPortal(false);
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
      <main className="container max-w-3xl py-8">
        <h1 className="mb-8 text-3xl font-bold">Settings</h1>

        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="font-medium">{userInfo?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="font-medium">{userInfo?.name || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Plan
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {userInfo?.plan.replace('_', ' ')}
                    </p>
                    <Badge
                      variant={
                        userInfo?.plan === 'FREE' ? 'secondary' : 'default'
                      }
                    >
                      {userInfo?.plan === 'FREE' ? 'Free' : 'Active'}
                    </Badge>
                  </div>
                </div>
                {userInfo?.plan === 'FREE' ? (
                  <Link href="/pricing">
                    <Button>Upgrade Plan</Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isLoadingPortal}
                  >
                    {isLoadingPortal && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Manage Billing
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Usage
                </label>
                <p className="font-medium">
                  {userInfo?.analysesUsed} / {userInfo?.analysesLimit} analyses
                  used
                </p>
                <p className="text-sm text-muted-foreground">
                  {userInfo?.remainingAnalyses} remaining
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sign out</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
