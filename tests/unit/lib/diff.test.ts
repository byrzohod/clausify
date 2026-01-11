import { describe, it, expect } from 'vitest';
import {
  compareTexts,
  normalizeText,
  getDiffStats,
  areTextsIdentical,
} from '@/lib/diff';

describe('diff utilities', () => {
  describe('normalizeText', () => {
    it('normalizes line endings', () => {
      expect(normalizeText('foo\r\nbar')).toBe('foo\nbar');
      expect(normalizeText('foo\rbar')).toBe('foo\nbar');
    });

    it('removes multiple blank lines', () => {
      expect(normalizeText('foo\n\n\n\nbar')).toBe('foo\n\nbar');
    });

    it('normalizes whitespace', () => {
      expect(normalizeText('foo   bar')).toBe('foo bar');
      expect(normalizeText('foo\tbar')).toBe('foo bar');
    });

    it('trims lines', () => {
      expect(normalizeText('  foo  \n  bar  ')).toBe('foo\nbar');
    });
  });

  describe('compareTexts', () => {
    it('returns no changes for identical texts', () => {
      const changes = compareTexts('hello world', 'hello world');
      expect(changes).toHaveLength(1);
      expect(changes[0].added).toBeFalsy();
      expect(changes[0].removed).toBeFalsy();
    });

    it('detects added lines', () => {
      const changes = compareTexts('line1', 'line1\nline2', 'line');
      const added = changes.filter((c) => c.added);
      expect(added.length).toBeGreaterThan(0);
    });

    it('detects removed lines', () => {
      const changes = compareTexts('line1\nline2', 'line1', 'line');
      const removed = changes.filter((c) => c.removed);
      expect(removed.length).toBeGreaterThan(0);
    });

    it('works in word mode', () => {
      const changes = compareTexts(
        'the quick brown fox',
        'the slow brown fox',
        'word'
      );
      const changed = changes.filter((c) => c.added || c.removed);
      expect(changed.length).toBeGreaterThan(0);
    });

    it('defaults to line mode', () => {
      const changes = compareTexts('line1\nline2', 'line1\nline3');
      // Line mode should detect line2 -> line3 change
      expect(changes.length).toBeGreaterThan(1);
    });
  });

  describe('getDiffStats', () => {
    it('counts additions correctly', () => {
      const changes = [
        { value: 'unchanged\n' },
        { value: 'added line\n', added: true },
      ];
      const stats = getDiffStats(changes);
      expect(stats.additions).toBe(1);
    });

    it('counts deletions correctly', () => {
      const changes = [
        { value: 'unchanged\n' },
        { value: 'removed line\n', removed: true },
      ];
      const stats = getDiffStats(changes);
      expect(stats.deletions).toBe(1);
    });

    it('counts unchanged correctly', () => {
      const changes = [
        { value: 'line1\nline2\n' },
      ];
      const stats = getDiffStats(changes);
      expect(stats.unchanged).toBe(2);
    });

    it('calculates total changes', () => {
      const changes = [
        { value: 'unchanged\n' },
        { value: 'added\n', added: true },
        { value: 'removed\n', removed: true },
      ];
      const stats = getDiffStats(changes);
      expect(stats.totalChanges).toBe(2);
    });
  });

  describe('areTextsIdentical', () => {
    it('returns true for identical texts', () => {
      expect(areTextsIdentical('hello', 'hello')).toBe(true);
    });

    it('returns true for texts that normalize to same', () => {
      expect(areTextsIdentical('hello  world', 'hello world')).toBe(true);
      expect(areTextsIdentical('hello\r\nworld', 'hello\nworld')).toBe(true);
    });

    it('returns false for different texts', () => {
      expect(areTextsIdentical('hello', 'world')).toBe(false);
    });
  });
});
