import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from '../prompt';
import type { AnalysisResult } from '@/types';
import { AIError } from '../client';

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export async function analyzeWithOllama(contractText: string): Promise<{
  result: AnalysisResult;
  tokenCount: number;
  processingTime: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: buildAnalysisPrompt(contractText),
          },
        ],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AIError(`Ollama API error: ${error}`);
    }

    const data: OllamaResponse = await response.json();
    const processingTime = Date.now() - startTime;

    const rawJson = data.message.content.trim();
    let parsedResult: Record<string, unknown>;

    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawJson;
      parsedResult = JSON.parse(jsonString);
    } catch {
      // If JSON parsing fails, create a basic result from the text
      console.error('Failed to parse Ollama response as JSON, creating basic result');
      parsedResult = {
        summary: rawJson.slice(0, 500),
        contractType: 'OTHER',
        riskScore: 'MEDIUM',
        keyTerms: [],
        obligations: [],
        redFlags: [],
        sections: [],
        parties: [],
        dates: [],
        amounts: [],
      };
    }

    // Import and use normalize function
    const result = normalizeAnalysisResult(parsedResult);

    return {
      result,
      tokenCount: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      processingTime,
    };
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    throw new AIError(
      `Ollama error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Normalize functions (duplicated from client.ts for now)
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

type ContractType = 'NDA' | 'EMPLOYMENT' | 'LEASE' | 'SERVICE' | 'FREELANCE' | 'SALES' | 'PARTNERSHIP' | 'LICENSE' | 'LOAN' | 'OTHER';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

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

// Check if Ollama is available
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// List available Ollama models
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}
