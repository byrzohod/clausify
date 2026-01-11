import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const riskConfig = {
  LOW: {
    label: 'Low Risk',
    variant: 'success' as const,
    icon: CheckCircle,
    description: 'This contract appears to have favorable or standard terms.',
  },
  MEDIUM: {
    label: 'Medium Risk',
    variant: 'warning' as const,
    icon: AlertCircle,
    description: 'This contract has some terms that warrant attention.',
  },
  HIGH: {
    label: 'High Risk',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    description:
      'This contract contains terms that may be unfavorable. Review carefully.',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function RiskBadge({
  level,
  showIcon = true,
  size = 'md',
  className,
}: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], 'font-medium', className)}
      data-testid="risk-badge"
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

export function RiskDescription({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  return (
    <p className="text-sm text-muted-foreground">
      {riskConfig[level].description}
    </p>
  );
}
