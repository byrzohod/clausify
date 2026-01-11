import { describe, it, expect } from 'vitest';
import {
  buildAnalysisPrompt,
  ANALYSIS_SYSTEM_PROMPT,
  ANALYSIS_USER_PROMPT,
} from '@/lib/ai/prompt';

describe('AI Prompts', () => {
  describe('ANALYSIS_SYSTEM_PROMPT', () => {
    it('includes disclaimer about not being legal advice', () => {
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('not providing legal advice');
    });

    it('includes instructions for thorough analysis', () => {
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('thorough');
    });

    it('includes instructions for plain language', () => {
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('plain English');
    });
  });

  describe('ANALYSIS_USER_PROMPT', () => {
    it('includes placeholder for contract text', () => {
      expect(ANALYSIS_USER_PROMPT).toContain('{CONTRACT_TEXT}');
    });

    it('specifies JSON response format', () => {
      expect(ANALYSIS_USER_PROMPT).toContain('JSON');
    });

    it('includes all required fields', () => {
      expect(ANALYSIS_USER_PROMPT).toContain('summary');
      expect(ANALYSIS_USER_PROMPT).toContain('contractType');
      expect(ANALYSIS_USER_PROMPT).toContain('riskScore');
      expect(ANALYSIS_USER_PROMPT).toContain('keyTerms');
      expect(ANALYSIS_USER_PROMPT).toContain('obligations');
      expect(ANALYSIS_USER_PROMPT).toContain('redFlags');
    });
  });

  describe('buildAnalysisPrompt', () => {
    it('replaces placeholder with contract text', () => {
      const contractText = 'This is a test contract.';
      const prompt = buildAnalysisPrompt(contractText);

      expect(prompt).toContain(contractText);
      expect(prompt).not.toContain('{CONTRACT_TEXT}');
    });

    it('truncates very long contracts at 50KB', () => {
      const longText = 'A'.repeat(60000); // 60KB, should be truncated at 50KB
      const prompt = buildAnalysisPrompt(longText);

      expect(prompt.length).toBeLessThan(longText.length);
      expect(prompt).toContain('[NOTE: Contract text was truncated at 50KB');
    });

    it('does not truncate contracts under the limit', () => {
      const shortText = 'Short contract text';
      const prompt = buildAnalysisPrompt(shortText);

      expect(prompt).toContain(shortText);
      expect(prompt).not.toContain('[NOTE: Contract text was truncated');
    });
  });
});
