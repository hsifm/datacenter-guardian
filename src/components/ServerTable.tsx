import { Server } from '@/types/server';
import { StatusIndicator } from './StatusIndicator';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ServerTableProps {
  servers: Server[];
  onServerClick?: (server: Server) => void;
}

export function ServerTable({ servers, onServerClick }: ServerTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Hostname</th>
              <th>IPMI/BMC IP</th>
              <th>Type</th>
              <th>Location</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Temp</th>
              <th>Power</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <tr 
                key={server.id} 
                className="cursor-pointer"
                onClick={() => onServerClick?.(server)}
              >
                <td>
                  <StatusIndicator status={server.status} />
                </td>
                <td className="font-mono font-medium text-foreground">
                  {server.hostname}
                </td>
                <td className="font-mono text-muted-foreground">
                  {server.ipmiIp}
                </td>
                <td>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {server.managementType}
                  </Badge>
                </td>
                <td className="text-muted-foreground">
                  {server.location.datacenter} / {server.location.rack}-U{server.location.unit}
                </td>
                <td>
                  <span className={
                    server.metrics.cpuUsage > 80 ? 'text-destructive' : 
                    server.metrics.cpuUsage > 60 ? 'text-warning' : 'text-foreground'
                  }>
                    {server.metrics.cpuUsage}%
                  </span>
                </td>
                <td>
                  <span className={
                    server.metrics.memoryUsage > 80 ? 'text-destructive' : 
                    server.metrics.memoryUsage > 60 ? 'text-warning' : 'text-foreground'
                  }>
                    {server.metrics.memoryUsage}%
                  </span>
                </td>
                <td>
                  <span className={
                    server.metrics.temperature > 60 ? 'text-destructive' : 
                    server.metrics.temperature > 45 ? 'text-warning' : 'text-foreground'
                  }>
                    {server.metrics.temperature}°C
                  </span>
                </td>
                <td className="font-mono text-muted-foreground">
                  {server.metrics.powerConsumption}W
                </td>
                <td className="text-muted-foreground text-xs">
                  {formatDistanceToNow(server.lastSeen, { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
