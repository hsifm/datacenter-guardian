import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Server, 
  Database, 
  Wifi,
  Clock,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { serverPollingService } from '@/services/serverPollingService';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

export default function Health() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runHealthChecks = async () => {
    setIsChecking(true);
    const results: HealthCheck[] = [];

    // Check 1: Application loaded
    results.push({
      name: 'Application',
      status: 'ok',
      message: 'React application loaded successfully',
      details: `Build: ${import.meta.env.MODE || 'production'}`,
    });

    // Check 2: LocalStorage available
    try {
      localStorage.setItem('health-check', 'test');
      localStorage.removeItem('health-check');
      results.push({
        name: 'Local Storage',
        status: 'ok',
        message: 'Browser storage is available',
        details: 'Connection configs will persist',
      });
    } catch {
      results.push({
        name: 'Local Storage',
        status: 'error',
        message: 'Browser storage is not available',
        details: 'Connection configs will not persist after refresh',
      });
    }

    // Check 3: Server connections configured
    const connections = serverPollingService.getConnections();
    if (connections.length > 0) {
      const enabledCount = connections.filter(c => c.enabled).length;
      const errorCount = connections.filter(c => c.lastError).length;
      
      results.push({
        name: 'Server Connections',
        status: errorCount > 0 ? 'warning' : 'ok',
        message: `${connections.length} connection(s) configured`,
        details: `${enabledCount} enabled, ${errorCount} with errors`,
      });
    } else {
      results.push({
        name: 'Server Connections',
        status: 'warning',
        message: 'No server connections configured',
        details: 'Add connections in the Connections tab',
      });
    }

    // Check 4: Fonts loaded
    const fontsLoaded = document.fonts.check('16px Inter') && 
                        document.fonts.check('16px "JetBrains Mono"');
    results.push({
      name: 'Fonts',
      status: fontsLoaded ? 'ok' : 'warning',
      message: fontsLoaded ? 'Custom fonts loaded' : 'Fonts may not be loaded',
      details: fontsLoaded ? 'Inter & JetBrains Mono' : 'Using system fallbacks',
    });

    // Check 5: Network (offline detection)
    results.push({
      name: 'Network Mode',
      status: navigator.onLine ? 'ok' : 'warning',
      message: navigator.onLine ? 'Browser reports online' : 'Browser reports offline',
      details: 'App works fully offline after initial load',
    });

    setChecks(results);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-5 h-5 text-[hsl(var(--server-online))]" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-[hsl(var(--server-warning))]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[hsl(var(--server-offline))]" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    const variants = {
      ok: 'bg-[hsl(var(--server-online)/0.2)] text-[hsl(var(--server-online))] border-[hsl(var(--server-online)/0.3)]',
      warning: 'bg-[hsl(var(--server-warning)/0.2)] text-[hsl(var(--server-warning))] border-[hsl(var(--server-warning)/0.3)]',
      error: 'bg-[hsl(var(--server-offline)/0.2)] text-[hsl(var(--server-offline))] border-[hsl(var(--server-offline)/0.3)]',
    };
    return variants[status];
  };

  const overallStatus = checks.some(c => c.status === 'error') 
    ? 'error' 
    : checks.some(c => c.status === 'warning') 
      ? 'warning' 
      : 'ok';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={runHealthChecks} disabled={isChecking}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border mb-4">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">System Health</h1>
          <p className="text-muted-foreground">
            Datacenter Inventory System Status
          </p>
        </div>

        {/* Overall Status */}
        <div className={`p-6 rounded-lg border mb-6 ${
          overallStatus === 'ok' 
            ? 'bg-[hsl(var(--server-online)/0.05)] border-[hsl(var(--server-online)/0.3)]'
            : overallStatus === 'warning'
              ? 'bg-[hsl(var(--server-warning)/0.05)] border-[hsl(var(--server-warning)/0.3)]'
              : 'bg-[hsl(var(--server-offline)/0.05)] border-[hsl(var(--server-offline)/0.3)]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="font-semibold text-foreground">
                  {overallStatus === 'ok' ? 'All Systems Operational' : 
                   overallStatus === 'warning' ? 'Some Warnings Detected' : 
                   'Issues Detected'}
                </h2>
                {lastChecked && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={getStatusBadge(overallStatus)}>
              {overallStatus.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Individual Checks */}
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div 
              key={index}
              className="p-4 rounded-lg bg-card border border-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-medium text-foreground">{check.name}</h3>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {check.details}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={getStatusBadge(check.status)}>
                  {check.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* System Info */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            System Information
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">User Agent</dt>
            <dd className="text-foreground font-mono text-xs truncate" title={navigator.userAgent}>
              {navigator.userAgent.substring(0, 50)}...
            </dd>
            <dt className="text-muted-foreground">Language</dt>
            <dd className="text-foreground font-mono">{navigator.language}</dd>
            <dt className="text-muted-foreground">Platform</dt>
            <dd className="text-foreground font-mono">{navigator.platform}</dd>
            <dt className="text-muted-foreground">Cookies Enabled</dt>
            <dd className="text-foreground font-mono">{navigator.cookieEnabled ? 'Yes' : 'No'}</dd>
          </dl>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Datacenter Inventory System • Air-Gapped Deployment Ready
        </p>
      </div>
    </div>
  );
}
