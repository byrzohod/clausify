'use client';

import { useMemo, useState } from 'react';
import { Plus, Minus, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compareTexts, getDiffStats, type DiffMode, type DiffChange } from '@/lib/diff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface DiffViewProps {
  leftText: string;
  rightText: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function DiffView({
  leftText,
  rightText,
  leftLabel = 'Original',
  rightLabel = 'Modified',
}: DiffViewProps) {
  const [mode, setMode] = useState<DiffMode>('line');

  const changes = useMemo(
    () => compareTexts(leftText, rightText, mode),
    [leftText, rightText, mode]
  );

  const stats = useMemo(() => getDiffStats(changes), [changes]);

  return (
    <Card data-testid="diff-view">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Differences</CardTitle>
            <CardDescription>
              Comparing {leftLabel} with {rightLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('line')}
            >
              Line by Line
            </Button>
            <Button
              variant={mode === 'word' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('word')}
            >
              Word by Word
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <DiffStatBadge
            icon={<Plus className="h-3 w-3" />}
            label="Added"
            count={stats.additions}
            variant="success"
          />
          <DiffStatBadge
            icon={<Minus className="h-3 w-3" />}
            label="Removed"
            count={stats.deletions}
            variant="destructive"
          />
          <DiffStatBadge
            icon={<Equal className="h-3 w-3" />}
            label="Unchanged"
            count={stats.unchanged}
            variant="secondary"
          />
        </div>
      </CardHeader>

      <CardContent>
        {stats.totalChanges === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-testid="diff-no-changes"
          >
            <Equal className="mb-4 h-12 w-12 text-green-500" />
            <h3 className="mb-2 font-medium">No differences found</h3>
            <p className="text-sm text-muted-foreground">
              The two contracts are identical
            </p>
          </div>
        ) : (
          <div
            className="max-h-[600px] overflow-auto rounded-md border bg-muted/30 font-mono text-sm"
            data-testid="diff-content"
          >
            {mode === 'line' ? (
              <LineDiffContent changes={changes} />
            ) : (
              <WordDiffContent changes={changes} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LineDiffContent({ changes }: { changes: DiffChange[] }) {
  return (
    <div className="divide-y divide-border">
      {changes.map((change, idx) => {
        const lines = change.value.split('\n').filter((l) => l !== '');
        return lines.map((line, lineIdx) => (
          <div
            key={`${idx}-${lineIdx}`}
            className={cn(
              'flex px-3 py-1',
              change.added && 'bg-green-100 dark:bg-green-950',
              change.removed && 'bg-red-100 dark:bg-red-950'
            )}
          >
            <span
              className={cn(
                'mr-3 w-5 shrink-0 text-right',
                change.added && 'text-green-600',
                change.removed && 'text-red-600',
                !change.added && !change.removed && 'text-muted-foreground'
              )}
            >
              {change.added ? '+' : change.removed ? '-' : ' '}
            </span>
            <span
              className={cn(
                'flex-1 whitespace-pre-wrap break-all',
                change.added && 'text-green-900 dark:text-green-100',
                change.removed && 'text-red-900 dark:text-red-100'
              )}
            >
              {line || '\u00A0'}
            </span>
          </div>
        ));
      })}
    </div>
  );
}

function WordDiffContent({ changes }: { changes: DiffChange[] }) {
  return (
    <div className="p-4 leading-relaxed">
      {changes.map((change, idx) => (
        <span
          key={idx}
          className={cn(
            change.added &&
              'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
            change.removed &&
              'bg-red-200 text-red-900 line-through dark:bg-red-800 dark:text-red-100'
          )}
        >
          {change.value}
        </span>
      ))}
    </div>
  );
}

function DiffStatBadge({
  icon,
  label,
  count,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  variant: 'success' | 'destructive' | 'secondary';
}) {
  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {count} {label}
    </Badge>
  );
}
