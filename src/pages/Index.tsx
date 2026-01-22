import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar, ViewType } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { ServerCard } from '@/components/ServerCard';
import { ServerTable } from '@/components/ServerTable';
import { ServerDetailPanel } from '@/components/ServerDetailPanel';
import { ConnectionsPanel } from '@/components/ConnectionsPanel';
import { useServerPolling } from '@/hooks/useServerPolling';
import { Server } from '@/types/server';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server as ServerIcon, Cpu, Thermometer, Zap, 
  AlertTriangle, LayoutGrid, List, Wifi, WifiOff 
} from 'lucide-react';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const {
    servers,
    liveServers,
    connections,
    isPolling,
    errors,
    addConnection,
    updateConnection,
    removeConnection,
    refreshAll,
    refreshOne,
    testConnection,
  } = useServerPolling({ includeMockData: true });

  const filteredServers = useMemo(() => {
    if (!searchQuery) return servers;
    const query = searchQuery.toLowerCase();
    return servers.filter(
      (s) =>
        s.hostname.toLowerCase().includes(query) ||
        s.ipmiIp.includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [searchQuery, servers]);

  const stats = useMemo(() => {
    const online = servers.filter((s) => s.status === 'online').length;
    const warnings = servers.filter((s) => s.status === 'warning').length;
    const offline = servers.filter((s) => s.status === 'offline').length;
    const totalPower = servers.reduce((acc, s) => acc + s.metrics.powerConsumption, 0);
    const activeServers = servers.filter((s) => s.metrics.temperature > 0);
    const avgTemp = activeServers.length > 0
      ? activeServers.reduce((acc, s) => acc + s.metrics.temperature, 0) / activeServers.length
      : 0;
    const cpuServers = servers.filter((s) => s.metrics.cpuUsage > 0);
    const avgCpu = cpuServers.length > 0
      ? cpuServers.reduce((acc, s) => acc + s.metrics.cpuUsage, 0) / cpuServers.length
      : 0;

    return { online, warnings, offline, totalPower, avgTemp: Math.round(avgTemp), avgCpu: Math.round(avgCpu) };
  }, [servers]);

  const handleRefresh = () => {
    if (connections.length > 0) {
      refreshAll();
    }
    console.log('Refreshing...');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        connectionCount={connections.length}
        liveServerCount={liveServers.length}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
        />

        <main className="flex-1 flex">
          <div className={`flex-1 p-6 overflow-y-auto ${selectedServer ? 'pr-0' : ''}`}>
            {activeView === 'dashboard' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                  <StatCard 
                    label="Total Servers" 
                    value={servers.length}
                    icon={<ServerIcon className="w-5 h-5" />}
                  />
                  <StatCard 
                    label="Online" 
                    value={stats.online}
                    icon={<div className="status-indicator status-online" />}
                  />
                  <StatCard 
                    label="Warnings" 
                    value={stats.warnings}
                    icon={<AlertTriangle className="w-5 h-5 text-warning" />}
                  />
                  <StatCard 
                    label="Avg CPU" 
                    value={`${stats.avgCpu}%`}
                    icon={<Cpu className="w-5 h-5" />}
                  />
                  <StatCard 
                    label="Avg Temp" 
                    value={`${stats.avgTemp}°C`}
                    icon={<Thermometer className="w-5 h-5" />}
                  />
                  <StatCard 
                    label="Total Power" 
                    value={`${(stats.totalPower / 1000).toFixed(1)}kW`}
                    icon={<Zap className="w-5 h-5" />}
                  />
                </div>

                {/* Live Servers Indicator */}
                {liveServers.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <Wifi className="w-4 h-4 text-[hsl(var(--server-online))]" />
                    <span className="text-[hsl(var(--server-online))]">
                      {liveServers.length} live server{liveServers.length !== 1 ? 's' : ''} connected
                    </span>
                    {isPolling && (
                      <span className="text-muted-foreground animate-pulse">• Polling...</span>
                    )}
                  </div>
                )}

                {/* View Controls */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Server Inventory
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      ({filteredServers.length} servers)
                    </span>
                  </h2>
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
                    <TabsList className="bg-muted">
                      <TabsTrigger value="grid" className="gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        Grid
                      </TabsTrigger>
                      <TabsTrigger value="table" className="gap-2">
                        <List className="w-4 h-4" />
                        Table
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Servers Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredServers.map((server) => (
                      <ServerCard 
                        key={server.id} 
                        server={server}
                        onClick={() => setSelectedServer(server)}
                      />
                    ))}
                  </div>
                ) : (
                  <ServerTable 
                    servers={filteredServers}
                    onServerClick={setSelectedServer}
                  />
                )}
              </>
            )}

            {activeView === 'servers' && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">All Servers</h2>
                <ServerTable 
                  servers={filteredServers}
                  onServerClick={setSelectedServer}
                />
              </div>
            )}

            {activeView === 'connections' && (
              <ConnectionsPanel
                connections={connections}
                errors={errors}
                isPolling={isPolling}
                onAdd={addConnection}
                onUpdate={updateConnection}
                onRemove={removeConnection}
                onRefresh={refreshOne}
                onRefreshAll={refreshAll}
                onTest={testConnection}
              />
            )}

            {activeView !== 'dashboard' && activeView !== 'servers' && activeView !== 'connections' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <ServerIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    This section is coming soon.
                  </p>
                  <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedServer && (
            <div className="w-96 border-l border-border">
              <ServerDetailPanel 
                server={selectedServer}
                onClose={() => setSelectedServer(null)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
