import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Server, HardDrive, Network, 
  AlertTriangle, Settings, Cable, Wifi 
} from 'lucide-react';

type ViewType = 'dashboard' | 'servers' | 'connections' | 'storage' | 'network' | 'alerts' | 'settings';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  connectionCount?: number;
  liveServerCount?: number;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'servers', label: 'Servers', icon: Server },
  { id: 'connections', label: 'Connections', icon: Cable },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange, connectionCount = 0, liveServerCount = 0 }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const showBadge = item.id === 'connections' && connectionCount > 0;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-primary' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                      {connectionCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className={cn(
              "w-4 h-4",
              liveServerCount > 0 ? "text-[hsl(var(--server-online))]" : "text-muted-foreground"
            )} />
            <span className="text-xs font-medium text-sidebar-foreground">Live Monitoring</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {liveServerCount > 0 
              ? `${liveServerCount} server${liveServerCount !== 1 ? 's' : ''} connected`
              : 'Add connections to enable live monitoring'
            }
          </p>
        </div>
      </div>
    </aside>
  );
}

export type { ViewType };
