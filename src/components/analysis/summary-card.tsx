import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RiskBadge, RiskDescription } from './risk-badge';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, DollarSign } from 'lucide-react';
import type { AnalysisResult, Party, DateInfo, AmountInfo } from '@/types';

interface SummaryCardProps {
  analysis: AnalysisResult;
}

export function SummaryCard({ analysis }: SummaryCardProps) {
  const {
    summary,
    contractType,
    riskScore,
    parties,
    dates,
    amounts,
  } = analysis;

  const importantDates = dates.filter((d) => d.importance === 'high');
  const totalAmount = amounts.length > 0 ? amounts[0] : null;

  return (
    <Card data-testid="summary-card" role="region" aria-label="Contract summary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl" id="summary-title">Contract Summary</CardTitle>
            <CardDescription className="mt-1">
              {contractType.replace('_', ' ')} Contract
            </CardDescription>
          </div>
          <RiskBadge level={riskScore} size="lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6" aria-labelledby="summary-title">
        <div role="status" aria-live="polite">
          <RiskDescription level={riskScore} />
        </div>

        <div className="rounded-lg bg-muted/50 p-4" aria-label="Contract summary text">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {summary}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {parties.length > 0 && (
            <QuickInfo
              icon={Users}
              title="Parties Involved"
              items={parties.map((p) => `${p.name} (${p.role})`)}
            />
          )}

          {importantDates.length > 0 && (
            <QuickInfo
              icon={Calendar}
              title="Key Dates"
              items={importantDates.map((d) => `${d.description}: ${d.date}`)}
            />
          )}

          {totalAmount && (
            <QuickInfo
              icon={DollarSign}
              title="Financial Terms"
              items={[
                `${totalAmount.description}: ${totalAmount.amount}${totalAmount.frequency ? ` (${totalAmount.frequency})` : ''}`,
              ]}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickInfoProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}

function QuickInfo({ icon: Icon, title, items }: QuickInfoProps) {
  const titleId = `quick-info-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="rounded-lg border p-3" role="group" aria-labelledby={titleId}>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium" id={titleId}>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span>{title}</span>
      </div>
      <ul className="space-y-1 text-sm text-muted-foreground" aria-label={`${title} list`}>
        {items.slice(0, 3).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
        {items.length > 3 && (
          <li className="text-xs" aria-label={`And ${items.length - 3} more items`}>
            +{items.length - 3} more
          </li>
        )}
      </ul>
    </div>
  );
}
