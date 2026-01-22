import { useState } from 'react';
import { ServerConnection } from '@/types/redfish';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle2, XCircle, Server } from 'lucide-react';

interface AddServerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (connection: Omit<ServerConnection, 'id'>) => void;
  onTest: (connection: Omit<ServerConnection, 'id'>) => Promise<{ success: boolean; message: string }>;
  editConnection?: ServerConnection;
  onUpdate?: (id: string, updates: Partial<ServerConnection>) => void;
}

export function AddServerModal({ 
  open, 
  onOpenChange, 
  onAdd, 
  onTest,
  editConnection,
  onUpdate 
}: AddServerModalProps) {
  const [name, setName] = useState(editConnection?.name || '');
  const [host, setHost] = useState(editConnection?.host || '');
  const [port, setPort] = useState(editConnection?.port?.toString() || '443');
  const [protocol, setProtocol] = useState<'https' | 'http'>(editConnection?.protocol || 'https');
  const [username, setUsername] = useState(editConnection?.username || '');
  const [password, setPassword] = useState(editConnection?.password || '');
  const [type, setType] = useState<ServerConnection['type']>(editConnection?.type || 'redfish');
  const [pollInterval, setPollInterval] = useState(editConnection?.pollInterval?.toString() || '30');
  const [enabled, setEnabled] = useState(editConnection?.enabled ?? true);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isEditing = !!editConnection;

  const resetForm = () => {
    setName('');
    setHost('');
    setPort('443');
    setProtocol('https');
    setUsername('');
    setPassword('');
    setType('redfish');
    setPollInterval('30');
    setEnabled(true);
    setTestResult(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const getConnectionData = (): Omit<ServerConnection, 'id'> => ({
    name: name.trim() || host,
    host: host.trim(),
    port: parseInt(port) || 443,
    protocol,
    username: username.trim(),
    password,
    type,
    pollInterval: parseInt(pollInterval) || 30,
    enabled,
  });

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await onTest(getConnectionData());
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = () => {
    const connectionData = getConnectionData();
    
    if (isEditing && onUpdate) {
      onUpdate(editConnection.id, connectionData);
    } else {
      onAdd(connectionData);
    }
    
    handleClose();
  };

  const isValid = host.trim() && username.trim() && password;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            {isEditing ? 'Edit Server Connection' : 'Add Server Connection'}
          </DialogTitle>
          <DialogDescription>
            Configure IPMI/iDRAC/Redfish connection to monitor a server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="e.g., Web Server 01"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Connection Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ServerConnection['type'])}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="redfish">Redfish</SelectItem>
                  <SelectItem value="idrac">Dell iDRAC</SelectItem>
                  <SelectItem value="ilo">HPE iLO</SelectItem>
                  <SelectItem value="ipmi">IPMI (via Redfish)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select value={protocol} onValueChange={(v) => setProtocol(v as 'https' | 'http')}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">Host/IP Address</Label>
              <Input
                id="host"
                placeholder="10.0.1.100"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="bg-input font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="443"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="bg-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="root"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pollInterval">Poll Interval (seconds)</Label>
              <Input
                id="pollInterval"
                type="number"
                min="5"
                max="3600"
                value={pollInterval}
                onChange={(e) => setPollInterval(e.target.value)}
                className="bg-input font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-poll Enabled</Label>
              <div className="flex items-center h-10">
                <Switch checked={enabled} onCheckedChange={setEnabled} />
                <span className="ml-2 text-sm text-muted-foreground">
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              testResult.success 
                ? 'bg-[hsl(var(--server-online)/0.1)] border border-[hsl(var(--server-online)/0.3)]' 
                : 'bg-[hsl(var(--server-offline)/0.1)] border border-[hsl(var(--server-offline)/0.3)]'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--server-online))] mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-[hsl(var(--server-offline))] mt-0.5" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleTest} 
            disabled={!isValid || isTesting}
          >
            {isTesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Test Connection
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
          >
            {isEditing ? 'Save Changes' : 'Add Server'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
