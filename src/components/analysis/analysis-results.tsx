'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCard } from './summary-card';
import { RedFlagsCard } from './red-flags-card';
import { ObligationsCard } from './obligations-card';
import { KeyTermsCard } from './key-terms-card';
import { SectionsCard } from './sections-card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportAnalysisToPdf, downloadPdf } from '@/lib/export';
import type { AnalysisResult } from '@/types';

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

      <Tabs defaultValue="red-flags" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="red-flags">
            Red Flags ({analysis.redFlags.length})
          </TabsTrigger>
          <TabsTrigger value="obligations">
            Obligations ({analysis.obligations.length})
          </TabsTrigger>
          <TabsTrigger value="key-terms">
            Key Terms ({analysis.keyTerms.length})
          </TabsTrigger>
          <TabsTrigger value="sections">
            Sections ({analysis.sections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="red-flags">
          <RedFlagsCard redFlags={analysis.redFlags} />
        </TabsContent>

        <TabsContent value="obligations">
          <ObligationsCard obligations={analysis.obligations} />
        </TabsContent>

        <TabsContent value="key-terms">
          <KeyTermsCard keyTerms={analysis.keyTerms} />
        </TabsContent>

        <TabsContent value="sections">
          <SectionsCard sections={analysis.sections} />
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
