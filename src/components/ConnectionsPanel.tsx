import { useState } from 'react';
import { ServerConnection } from '@/types/redfish';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit2, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Server
} from 'lucide-react';
import { AddServerModal } from './AddServerModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConnectionsPanelProps {
  connections: ServerConnection[];
  errors: Map<string, string>;
  isPolling: boolean;
  onAdd: (connection: Omit<ServerConnection, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ServerConnection>) => void;
  onRemove: (id: string) => void;
  onRefresh: (id: string) => void;
  onRefreshAll: () => void;
  onTest: (connection: Omit<ServerConnection, 'id'>) => Promise<{ success: boolean; message: string }>;
}

export function ConnectionsPanel({
  connections,
  errors,
  isPolling,
  onAdd,
  onUpdate,
  onRemove,
  onRefresh,
  onRefreshAll,
  onTest,
}: ConnectionsPanelProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ServerConnection | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatLastPolled = (date?: Date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getTypeColor = (type: ServerConnection['type']) => {
    switch (type) {
      case 'idrac': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ilo': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'redfish': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Server Connections</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshAll}
            disabled={isPolling || connections.length === 0}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Server className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-medium mb-1">No Connections</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add your first server to start monitoring
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Server
            </Button>
          </div>
        ) : (
          connections.map((conn) => {
            const hasError = errors.has(conn.id);
            
            return (
              <div 
                key={conn.id}
                className={`p-4 rounded-lg border transition-colors ${
                  hasError 
                    ? 'bg-[hsl(var(--server-offline)/0.05)] border-[hsl(var(--server-offline)/0.3)]' 
                    : 'bg-card border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{conn.name}</h3>
                      <Badge variant="outline" className={getTypeColor(conn.type)}>
                        {conn.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {conn.protocol}://{conn.host}:{conn.port}
                    </p>
                  </div>
                  <Switch 
                    checked={conn.enabled}
                    onCheckedChange={(enabled) => onUpdate(conn.id, { enabled })}
                  />
                </div>

                {/* Status Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Poll: {conn.pollInterval}s
                  </span>
                  <span className="flex items-center gap-1">
                    {hasError ? (
                      <AlertCircle className="w-3 h-3 text-[hsl(var(--server-offline))]" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-[hsl(var(--server-online))]" />
                    )}
                    {formatLastPolled(conn.lastPolled)}
                  </span>
                </div>

                {/* Error Message */}
                {hasError && (
                  <div className="text-xs text-[hsl(var(--server-offline))] bg-[hsl(var(--server-offline)/0.1)] p-2 rounded mb-3">
                    {errors.get(conn.id)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onRefresh(conn.id)}
                    disabled={isPolling}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingConnection(conn)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmId(conn.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddServerModal
        open={isAddModalOpen || !!editingConnection}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingConnection(undefined);
          }
        }}
        onAdd={onAdd}
        onTest={onTest}
        editConnection={editingConnection}
        onUpdate={onUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Server Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  onRemove(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
