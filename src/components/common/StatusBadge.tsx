import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'success' | 'failed' | 'active' | 'inactive' | 'available' | 'booked';
  className?: string;
}

const statusStyles = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  success: 'bg-success/10 text-success border-success/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  available: 'bg-success/10 text-success border-success/20',
  booked: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'capitalize font-medium',
        statusStyles[status],
        className
      )}
    >
      {status}
    </Badge>
  );
}
