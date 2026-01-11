'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Scale,
  FileText,
  ArrowRight,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { AnalysisResult, RiskLevel } from '@/types';

interface ComparisonInsights {
  riskComparison: {
    left: string;
    right: string;
    same: boolean;
  };
  redFlagsComparison: {
    left: number;
    right: number;
    leftHighSeverity: number;
    rightHighSeverity: number;
  };
  obligationsComparison: {
    left: number;
    right: number;
  };
  keyTermsComparison: {
    shared: number;
    onlyInLeft: number;
    onlyInRight: number;
  };
  insights: string[];
}

interface AnalysisComparisonProps {
  leftText: string;
  rightText: string;
  leftName: string;
  rightName: string;
}

export function AnalysisComparison({
  leftText,
  rightText,
  leftName,
  rightName,
}: AnalysisComparisonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [leftAnalysis, setLeftAnalysis] = useState<AnalysisResult | null>(null);
  const [rightAnalysis, setRightAnalysis] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonInsights | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leftText,
          rightText,
          leftName,
          rightName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();
      setLeftAnalysis(data.left);
      setRightAnalysis(data.right);
      setComparison(data.comparison);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to analyze contracts'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!leftAnalysis || !rightAnalysis || !comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            AI Comparison Analysis
          </CardTitle>
          <CardDescription>
            Run AI analysis on both contracts to compare key terms, risks, and
            obligations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Scale className="mr-2 h-4 w-4" />
                Run Comparative Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="analysis-comparison">
      {/* Insights */}
      {comparison.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Differences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {comparison.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risk Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <RiskCard
          title={leftName}
          riskLevel={leftAnalysis.riskScore}
          redFlagsCount={leftAnalysis.redFlags?.length || 0}
          highSeverityCount={
            leftAnalysis.redFlags?.filter((r) => r.severity === 'high').length ||
            0
          }
        />
        <RiskCard
          title={rightName}
          riskLevel={rightAnalysis.riskScore}
          redFlagsCount={rightAnalysis.redFlags?.length || 0}
          highSeverityCount={
            rightAnalysis.redFlags?.filter((r) => r.severity === 'high')
              .length || 0
          }
        />
      </div>

      {/* Stats Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Red Flags"
              left={comparison.redFlagsComparison.left}
              right={comparison.redFlagsComparison.right}
            />
            <StatCard
              label="Obligations"
              left={comparison.obligationsComparison.left}
              right={comparison.obligationsComparison.right}
            />
            <StatCard
              label="Shared Terms"
              value={comparison.keyTermsComparison.shared}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RiskCard({
  title,
  riskLevel,
  redFlagsCount,
  highSeverityCount,
}: {
  title: string;
  riskLevel: RiskLevel;
  redFlagsCount: number;
  highSeverityCount: number;
}) {
  const riskColors = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Card className={riskColors[riskLevel]}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Risk Level</span>
            <Badge
              variant={
                riskLevel === 'HIGH'
                  ? 'destructive'
                  : riskLevel === 'MEDIUM'
                    ? 'warning'
                    : 'success'
              }
            >
              {riskLevel}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Red Flags</span>
            <span className="font-medium">{redFlagsCount}</span>
          </div>
          {highSeverityCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {highSeverityCount} high severity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  left,
  right,
  value,
}: {
  label: string;
  left?: number;
  right?: number;
  value?: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      {value !== undefined ? (
        <p className="mt-1 text-2xl font-bold">{value}</p>
      ) : (
        <p className="mt-1 text-2xl font-bold">
          {left} <span className="text-muted-foreground">vs</span> {right}
        </p>
      )}
    </div>
  );
}
