'use client';

import { useState, lazy, Suspense, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCard } from './summary-card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { exportAnalysisToPdf, downloadPdf } from '@/lib/export';
import type { AnalysisResult } from '@/types';

// Lazy load tab content components for better initial page load
const RedFlagsCard = lazy(() =>
  import('./red-flags-card').then((mod) => ({ default: mod.RedFlagsCard }))
);
const ObligationsCard = lazy(() =>
  import('./obligations-card').then((mod) => ({ default: mod.ObligationsCard }))
);
const KeyTermsCard = lazy(() =>
  import('./key-terms-card').then((mod) => ({ default: mod.KeyTermsCard }))
);
const SectionsCard = lazy(() =>
  import('./sections-card').then((mod) => ({ default: mod.SectionsCard }))
);

// Loading skeleton for lazy-loaded tabs
function TabSkeleton() {
  return (
    <div className="space-y-4 p-6" data-testid="tab-skeleton">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  fileName?: string;
  onExport?: () => void;
}

export function AnalysisResults({
  analysis,
  fileName,
}: AnalysisResultsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('red-flags');
  // Track visited tabs to keep them mounted after first visit (prevents re-loading)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['red-flags']));

  // Memoize the tab change handler
  const handleTabChange = useMemo(
    () => (value: string) => {
      setActiveTab(value);
      setVisitedTabs((prev) => new Set([...prev, value]));
    },
    []
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportAnalysisToPdf(analysis, fileName);
      downloadPdf(blob, fileName || 'Contract');
      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="analysis-results">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          {fileName && (
            <p className="text-muted-foreground">for {fileName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      <SummaryCard analysis={analysis} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Scrollable tabs container for mobile */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max min-w-full md:grid md:w-full md:grid-cols-4">
            <TabsTrigger value="red-flags" className="whitespace-nowrap">
              Red Flags ({analysis.redFlags.length})
            </TabsTrigger>
            <TabsTrigger value="obligations" className="whitespace-nowrap">
              Obligations ({analysis.obligations.length})
            </TabsTrigger>
            <TabsTrigger value="key-terms" className="whitespace-nowrap">
              Key Terms ({analysis.keyTerms.length})
            </TabsTrigger>
            <TabsTrigger value="sections" className="whitespace-nowrap">
              Sections ({analysis.sections.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Lazy-loaded tab content - only mounts when tab is visited */}
        <TabsContent value="red-flags" forceMount={visitedTabs.has('red-flags') ? undefined : undefined}>
          {visitedTabs.has('red-flags') && (
            <Suspense fallback={<TabSkeleton />}>
              <RedFlagsCard redFlags={analysis.redFlags} />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="obligations">
          {visitedTabs.has('obligations') && (
            <Suspense fallback={<TabSkeleton />}>
              <ObligationsCard obligations={analysis.obligations} />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="key-terms">
          {visitedTabs.has('key-terms') && (
            <Suspense fallback={<TabSkeleton />}>
              <KeyTermsCard keyTerms={analysis.keyTerms} />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="sections">
          {visitedTabs.has('sections') && (
            <Suspense fallback={<TabSkeleton />}>
              <SectionsCard sections={analysis.sections} />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium">Disclaimer</p>
        <p className="mt-1">
          This analysis is provided for informational purposes only and does not
          constitute legal advice. The AI-generated analysis may not identify
          all issues or accurately interpret all contract terms. We strongly
          recommend consulting with a qualified attorney before making any
          decisions based on this analysis.
        </p>
      </div>
    </div>
  );
}
