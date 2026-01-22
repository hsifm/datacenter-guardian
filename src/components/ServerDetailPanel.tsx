import { Server } from '@/types/server';
import { StatusIndicator } from './StatusIndicator';
import { MetricBar } from './MetricBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  X, Server as ServerIcon, Cpu, MemoryStick, HardDrive, 
  Network, Thermometer, Fan, Zap, MapPin, RefreshCw 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ServerDetailPanelProps {
  server: Server;
  onClose: () => void;
}

export function ServerDetailPanel({ server, onClose }: ServerDetailPanelProps) {
  return (
    <div className="bg-card border-l border-border h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <ServerIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-mono text-xl font-semibold text-foreground">{server.hostname}</h2>
              <p className="text-sm text-muted-foreground">{server.hardware.manufacturer} {server.hardware.model}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <StatusIndicator status={server.status} showLabel size="lg" />
          <Badge variant="secondary" className="font-mono">{server.managementType}</Badge>
          <span className="text-xs text-muted-foreground">
            Last seen: {formatDistanceToNow(server.lastSeen, { addSuffix: true })}
          </span>
        </div>

        <Button variant="outline" size="sm" className="mb-6">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>

        <Separator className="mb-6" />

        {/* Metrics */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Real-time Metrics
          </h3>
          <div className="space-y-4">
            <MetricBar value={server.metrics.cpuUsage} label="CPU Usage" variant="usage" />
            <MetricBar value={server.metrics.memoryUsage} label="Memory Usage" variant="usage" />
            <MetricBar value={server.metrics.temperature} max={80} label="Temperature" variant="temperature" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Fan className="w-3.5 h-3.5" />
                <span className="text-xs">Fan Speed</span>
              </div>
              <p className="font-mono text-foreground">{server.metrics.fanSpeed} RPM</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs">Power</span>
              </div>
              <p className="font-mono text-foreground">{server.metrics.powerConsumption}W</p>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Hardware Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <ServerIcon className="w-4 h-4 text-primary" />
            Hardware
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial Number</span>
              <span className="font-mono text-foreground">{server.hardware.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BIOS Version</span>
              <span className="font-mono text-foreground">{server.hardware.biosVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-mono text-foreground text-right text-xs">{server.specs.cpu}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cores</span>
              <span className="font-mono text-foreground">{server.specs.cpuCores}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-mono text-foreground">{server.specs.memory}</span>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Storage */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary" />
            Storage
          </h3>
          <div className="space-y-2">
            {server.specs.storage.map((drive, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">{drive.name}</span>
                  <Badge variant="outline" className="text-xs">{drive.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{drive.capacity}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    drive.health === 'healthy' ? 'bg-success' :
                    drive.health === 'warning' ? 'bg-warning' : 'bg-destructive'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Network */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Network Interfaces
          </h3>
          <div className="space-y-2">
            {server.network.map((iface, idx) => (
              <div key={idx} className="bg-muted/50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-foreground">{iface.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    iface.status === 'up' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {iface.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>IP: <span className="font-mono">{iface.ip}</span></p>
                  <p>MAC: <span className="font-mono">{iface.mac}</span></p>
                  <p>Speed: <span className="font-mono">{iface.speed}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Location */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Location
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Datacenter</span>
              <span className="font-mono text-foreground">{server.location.datacenter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rack</span>
              <span className="font-mono text-foreground">{server.location.rack}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-mono text-foreground">U{server.location.unit}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {server.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
