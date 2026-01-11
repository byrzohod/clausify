import { analyzeContract as analyzeWithAnthropic, AIError } from './client';
import { analyzeWithOllama, isOllamaAvailable } from './providers/ollama';
import type { AnalysisResult } from '@/types';

export { AIError } from './client';
export { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompt';

type AIProvider = 'anthropic' | 'ollama' | 'auto';

interface AnalysisApiResult {
  result: AnalysisResult;
  tokenCount: number;
  processingTime: number;
}

/**
 * Analyze a contract using the configured AI provider
 *
 * Provider selection:
 * - If AI_PROVIDER=ollama, uses Ollama
 * - If AI_PROVIDER=anthropic, uses Anthropic
 * - If AI_PROVIDER=auto (default), tries Ollama first, falls back to Anthropic
 */
export async function analyzeContract(
  contractText: string
): Promise<AnalysisApiResult> {
  const provider = (process.env.AI_PROVIDER || 'auto') as AIProvider;

  if (provider === 'ollama') {
    console.log('[AI] Using Ollama provider');
    return analyzeWithOllama(contractText);
  }

  if (provider === 'anthropic') {
    console.log('[AI] Using Anthropic provider');
    return analyzeWithAnthropic(contractText);
  }

  // Auto mode: try Ollama first, fall back to Anthropic
  console.log('[AI] Auto-detecting provider...');

  const ollamaAvailable = await isOllamaAvailable();
  if (ollamaAvailable) {
    console.log('[AI] Ollama detected, using local model');
    try {
      return await analyzeWithOllama(contractText);
    } catch (error) {
      console.warn('[AI] Ollama failed, falling back to Anthropic:', error);
    }
  }

  // Fall back to Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('[AI] Using Anthropic provider');
    return analyzeWithAnthropic(contractText);
  }

  throw new AIError(
    'No AI provider available. Start Ollama locally or set ANTHROPIC_API_KEY.'
  );
}
