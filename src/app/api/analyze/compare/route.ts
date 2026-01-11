import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { analyzeContract, AIError } from '@/lib/ai';
import { z } from 'zod';
import type { AnalysisResult } from '@/types';

const compareSchema = z.object({
  leftText: z.string().min(1),
  rightText: z.string().min(1),
  leftName: z.string().optional(),
  rightName: z.string().optional(),
});

// POST /api/analyze/compare - Analyze two contracts for comparison
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = compareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { leftText, rightText } = parsed.data;

    // Analyze both contracts in parallel
    const [leftResult, rightResult] = await Promise.all([
      analyzeContract(leftText).catch((e) => ({
        error: e instanceof AIError ? e.message : 'Analysis failed',
      })),
      analyzeContract(rightText).catch((e) => ({
        error: e instanceof AIError ? e.message : 'Analysis failed',
      })),
    ]);

    // Check for errors
    if ('error' in leftResult || 'error' in rightResult) {
      return NextResponse.json(
        {
          error: 'Analysis failed',
          leftError: 'error' in leftResult ? leftResult.error : null,
          rightError: 'error' in rightResult ? rightResult.error : null,
        },
        { status: 500 }
      );
    }

    // Extract results
    const leftAnalysis = leftResult.result;
    const rightAnalysis = rightResult.result;

    // Compare and generate insights
    const comparison = generateComparison(leftAnalysis, rightAnalysis);

    return NextResponse.json({
      left: leftAnalysis,
      right: rightAnalysis,
      comparison,
    });
  } catch (error) {
    console.error('[API] Compare analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contracts' },
      { status: 500 }
    );
  }
}

function generateComparison(left: AnalysisResult, right: AnalysisResult) {
  const insights: string[] = [];

  // Compare risk scores
  if (left.riskScore !== right.riskScore) {
    insights.push(
      `Risk level differs: ${left.riskScore} vs ${right.riskScore}`
    );
  }

  // Compare contract types
  if (left.contractType !== right.contractType) {
    insights.push(
      `Contract types differ: ${left.contractType} vs ${right.contractType}`
    );
  }

  // Compare red flags count
  const leftRedFlagsHigh = left.redFlags?.filter((r) => r.severity === 'high').length || 0;
  const rightRedFlagsHigh = right.redFlags?.filter((r) => r.severity === 'high').length || 0;

  if (leftRedFlagsHigh !== rightRedFlagsHigh) {
    insights.push(
      `High-severity red flags differ: ${leftRedFlagsHigh} vs ${rightRedFlagsHigh}`
    );
  }

  // Compare obligations count
  const leftObligations = left.obligations?.length || 0;
  const rightObligations = right.obligations?.length || 0;

  if (Math.abs(leftObligations - rightObligations) > 2) {
    insights.push(
      `Significant difference in obligations: ${leftObligations} vs ${rightObligations}`
    );
  }

  // Find unique key terms
  const leftTerms = new Set(left.keyTerms?.map((t) => t.term.toLowerCase()) || []);
  const rightTerms = new Set(right.keyTerms?.map((t) => t.term.toLowerCase()) || []);

  const onlyInLeft = Array.from(leftTerms).filter((t) => !rightTerms.has(t));
  const onlyInRight = Array.from(rightTerms).filter((t) => !leftTerms.has(t));

  if (onlyInLeft.length > 0) {
    insights.push(`Terms only in first contract: ${onlyInLeft.slice(0, 3).join(', ')}`);
  }

  if (onlyInRight.length > 0) {
    insights.push(`Terms only in second contract: ${onlyInRight.slice(0, 3).join(', ')}`);
  }

  return {
    riskComparison: {
      left: left.riskScore,
      right: right.riskScore,
      same: left.riskScore === right.riskScore,
    },
    redFlagsComparison: {
      left: left.redFlags?.length || 0,
      right: right.redFlags?.length || 0,
      leftHighSeverity: leftRedFlagsHigh,
      rightHighSeverity: rightRedFlagsHigh,
    },
    obligationsComparison: {
      left: leftObligations,
      right: rightObligations,
    },
    keyTermsComparison: {
      shared: Array.from(leftTerms).filter((t) => rightTerms.has(t)).length,
      onlyInLeft: onlyInLeft.length,
      onlyInRight: onlyInRight.length,
    },
    insights,
  };
}
