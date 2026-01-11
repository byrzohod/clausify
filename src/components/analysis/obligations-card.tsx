import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClipboardList, User, Clock, AlertCircle } from 'lucide-react';
import type { Obligation } from '@/types';

interface ObligationsCardProps {
  obligations: Obligation[];
}

export function ObligationsCard({ obligations }: ObligationsCardProps) {
  // Group obligations by party
  const groupedObligations = obligations.reduce(
    (acc, obligation) => {
      const party = obligation.party || 'Unspecified Party';
      if (!acc[party]) {
        acc[party] = [];
      }
      acc[party].push(obligation);
      return acc;
    },
    {} as Record<string, Obligation[]>
  );

  const parties = Object.keys(groupedObligations);

  return (
    <Card data-testid="obligations-card" role="region" aria-label="Contract obligations">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl" id="obligations-title">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          Obligations & Responsibilities
        </CardTitle>
        <CardDescription>
          {obligations.length === 0
            ? 'No specific obligations identified'
            : `${obligations.length} obligation${obligations.length === 1 ? '' : 's'} across ${parties.length} ${parties.length === 1 ? 'party' : 'parties'}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {obligations.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed py-8 text-muted-foreground">
            <div className="text-center">
              <ClipboardList className="mx-auto mb-2 h-8 w-8" />
              <p>No specific obligations were identified.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {parties.map((party, partyIndex) => (
              <div key={party}>
                {partyIndex > 0 && <Separator className="mb-6" />}

                <div className="mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">{party}</h4>
                  <Badge variant="secondary">
                    {groupedObligations[party].length} item
                    {groupedObligations[party].length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-3 pl-6">
                  {groupedObligations[party].map((obligation, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                    >
                      <p className="text-sm">{obligation.description}</p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {obligation.deadline && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{obligation.deadline}</span>
                          </div>
                        )}

                        {obligation.consequence && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>Consequence: {obligation.consequence}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
