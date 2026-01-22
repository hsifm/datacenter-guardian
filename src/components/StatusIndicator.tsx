import { ServerStatus } from '@/types/server';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: ServerStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<ServerStatus, { label: string; className: string }> = {
  online: { label: 'Online', className: 'status-online' },
  offline: { label: 'Offline', className: 'status-offline' },
  warning: { label: 'Warning', className: 'status-warning' },
  maintenance: { label: 'Maintenance', className: 'status-maintenance' },
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function StatusIndicator({ status, showLabel = false, size = 'md' }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'status-indicator rounded-full animate-pulse',
          config.className,
          sizeClasses[size]
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium capitalize">{config.label}</span>
      )}
    </div>
  );
}
