import { cn } from '@/lib/utils';

interface MetricBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'temperature' | 'usage';
}

export function MetricBar({ 
  value, 
  max = 100, 
  label, 
  showValue = true, 
  size = 'md',
  variant = 'default' 
}: MetricBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getBarColor = () => {
    if (variant === 'temperature') {
      if (percentage > 80) return 'bg-destructive';
      if (percentage > 60) return 'bg-warning';
      return 'bg-success';
    }
    if (variant === 'usage') {
      if (percentage > 90) return 'bg-destructive';
      if (percentage > 70) return 'bg-warning';
      return 'bg-primary';
    }
    return 'bg-primary';
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-mono text-foreground">{value}%</span>}
        </div>
      )}
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
