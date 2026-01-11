import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompt';
import type { AnalysisResult } from '@/types';
import { ContractType, RiskLevel } from '@prisma/client';

// Lazy initialization to allow build without env vars
let _anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIError('ANTHROPIC_API_KEY is not configured');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

interface AnalysisApiResult {
  result: AnalysisResult;
  tokenCount: number;
  processingTime: number;
}

export async function analyzeContract(
  contractText: string
): Promise<AnalysisApiResult> {
  const startTime = Date.now();

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildAnalysisPrompt(contractText),
        },
      ],
    });

    const processingTime = Date.now() - startTime;

    // Extract text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new AIError('No text response from AI');
    }

    // Parse JSON response
    const rawJson = textContent.text.trim();
    let parsedResult: Record<string, unknown>;

    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawJson;
      parsedResult = JSON.parse(jsonString);
    } catch {
      throw new AIError('Failed to parse AI response as JSON');
    }

    // Validate and normalize the result
    const result = normalizeAnalysisResult(parsedResult);

    return {
      result,
      tokenCount:
        (message.usage?.input_tokens || 0) +
        (message.usage?.output_tokens || 0),
      processingTime,
    };
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    if (error instanceof Anthropic.APIError) {
      throw new AIError(`Claude API error: ${error.message}`);
    }
    throw new AIError(
      `Failed to analyze contract: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function normalizeAnalysisResult(
  raw: Record<string, unknown>
): AnalysisResult {
  return {
    summary: String(raw.summary || 'Unable to generate summary'),
    contractType: normalizeContractType(raw.contractType),
    riskScore: normalizeRiskLevel(raw.riskScore),
    keyTerms: normalizeArray(raw.keyTerms).map((item) => ({
      term: String(item.term || ''),
      value: String(item.value || ''),
      importance: normalizeImportance(item.importance),
      explanation: item.explanation ? String(item.explanation) : undefined,
    })),
    obligations: normalizeArray(raw.obligations).map((item) => ({
      party: String(item.party || ''),
      description: String(item.description || ''),
      deadline: item.deadline ? String(item.deadline) : undefined,
      consequence: item.consequence ? String(item.consequence) : undefined,
    })),
    redFlags: normalizeArray(raw.redFlags).map((item) => ({
      title: String(item.title || ''),
      description: String(item.description || ''),
      severity: normalizeSeverity(item.severity),
      suggestion: item.suggestion ? String(item.suggestion) : undefined,
      clause: item.clause ? String(item.clause) : undefined,
    })),
    sections: normalizeArray(raw.sections).map((item) => ({
      title: String(item.title || ''),
      summary: String(item.summary || ''),
      originalText: item.originalText ? String(item.originalText) : undefined,
      concerns: item.concerns
        ? normalizeArray(item.concerns).map(String)
        : undefined,
    })),
    parties: normalizeArray(raw.parties).map((item) => ({
      name: String(item.name || ''),
      role: String(item.role || ''),
      obligations: item.obligations
        ? normalizeArray(item.obligations).map(String)
        : undefined,
    })),
    dates: normalizeArray(raw.dates).map((item) => ({
      description: String(item.description || ''),
      date: String(item.date || ''),
      importance: normalizeImportance(item.importance),
    })),
    amounts: normalizeArray(raw.amounts).map((item) => ({
      description: String(item.description || ''),
      amount: String(item.amount || ''),
      currency: item.currency ? String(item.currency) : undefined,
      frequency: item.frequency ? String(item.frequency) : undefined,
    })),
  };
}

function normalizeArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === 'object');
}

function normalizeContractType(value: unknown): ContractType {
  const str = String(value).toUpperCase();
  const validTypes: ContractType[] = [
    'NDA',
    'EMPLOYMENT',
    'LEASE',
    'SERVICE',
    'FREELANCE',
    'SALES',
    'PARTNERSHIP',
    'LICENSE',
    'LOAN',
    'OTHER',
  ];
  return validTypes.includes(str as ContractType)
    ? (str as ContractType)
    : 'OTHER';
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  const str = String(value).toUpperCase();
  if (str === 'LOW' || str === 'MEDIUM' || str === 'HIGH') {
    return str as RiskLevel;
  }
  return 'MEDIUM';
}

function normalizeImportance(value: unknown): 'high' | 'medium' | 'low' {
  const str = String(value).toLowerCase();
  if (str === 'high' || str === 'medium' || str === 'low') {
    return str;
  }
  return 'medium';
}

function normalizeSeverity(value: unknown): 'high' | 'medium' | 'low' {
  return normalizeImportance(value);
}
