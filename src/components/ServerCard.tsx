import { Server } from '@/types/server';
import { StatusIndicator } from './StatusIndicator';
import { MetricBar } from './MetricBar';
import { Badge } from '@/components/ui/badge';
import { Cpu, HardDrive, MemoryStick, Thermometer, Server as ServerIcon } from 'lucide-react';

interface ServerCardProps {
  server: Server;
  onClick?: () => void;
}

export function ServerCard({ server, onClick }: ServerCardProps) {
  return (
    <div 
      className="stat-card cursor-pointer hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <ServerIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-foreground">{server.hostname}</h3>
            <p className="text-xs text-muted-foreground">{server.ipmiIp}</p>
          </div>
        </div>
        <StatusIndicator status={server.status} />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <MetricBar value={server.metrics.cpuUsage} variant="usage" size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <MemoryStick className="w-3.5 h-3.5 text-muted-foreground" />
          <MetricBar value={server.metrics.memoryUsage} variant="usage" size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
          <MetricBar value={server.metrics.temperature} max={80} variant="temperature" size="sm" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <HardDrive className="w-3 h-3" />
          <span>{server.specs.storage.length} drives</span>
        </div>
        <Badge variant="secondary" className="text-xs font-mono">
          {server.managementType}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {server.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
