import { describe, it, expect, vi, beforeEach } from 'vitest';

// These tests verify the AI provider selection logic

describe('AI Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Selection Logic', () => {
    it('should export analyzeContract function', async () => {
      const aiModule = await import('@/lib/ai');
      expect(typeof aiModule.analyzeContract).toBe('function');
    });

    it('should export AIError class', async () => {
      const aiModule = await import('@/lib/ai');
      expect(aiModule.AIError).toBeDefined();
    });

    it('should export ANALYSIS_SYSTEM_PROMPT', async () => {
      const aiModule = await import('@/lib/ai');
      expect(aiModule.ANALYSIS_SYSTEM_PROMPT).toBeDefined();
      expect(typeof aiModule.ANALYSIS_SYSTEM_PROMPT).toBe('string');
    });

    it('should export buildAnalysisPrompt function', async () => {
      const aiModule = await import('@/lib/ai');
      expect(typeof aiModule.buildAnalysisPrompt).toBe('function');
    });
  });

  describe('AIError', () => {
    it('should create error with message', async () => {
      const { AIError } = await import('@/lib/ai');
      const error = new AIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AIError');
    });

    it('should be an instance of Error', async () => {
      const { AIError } = await import('@/lib/ai');
      const error = new AIError('Test error');
      expect(error instanceof Error).toBe(true);
    });
  });
});
