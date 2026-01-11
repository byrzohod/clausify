import { diffLines, diffWords, Change } from 'diff';

export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export type DiffMode = 'line' | 'word';

/**
 * Compare two texts and return an array of changes.
 */
export function compareTexts(
  oldText: string,
  newText: string,
  mode: DiffMode = 'line'
): DiffChange[] {
  // Normalize text for better comparison
  const normalizedOld = normalizeText(oldText);
  const normalizedNew = normalizeText(newText);

  if (mode === 'word') {
    return diffWords(normalizedOld, normalizedNew);
  }

  return diffLines(normalizedOld, normalizedNew);
}

/**
 * Normalize text for better comparison results.
 * Handles common issues with PDF/DOCX extracted text.
 */
export function normalizeText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Normalize whitespace within lines (preserve single spaces)
    .replace(/[ \t]+/g, ' ')
    // Trim whitespace from line ends
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Trim overall
    .trim();
}

/**
 * Calculate diff statistics.
 */
export function getDiffStats(changes: DiffChange[]): {
  additions: number;
  deletions: number;
  unchanged: number;
  totalChanges: number;
} {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const change of changes) {
    const lines = change.value.split('\n').filter((l) => l.length > 0).length;
    if (change.added) {
      additions += lines;
    } else if (change.removed) {
      deletions += lines;
    } else {
      unchanged += lines;
    }
  }

  return {
    additions,
    deletions,
    unchanged,
    totalChanges: additions + deletions,
  };
}

/**
 * Check if two texts are identical after normalization.
 */
export function areTextsIdentical(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}

export type { Change };
