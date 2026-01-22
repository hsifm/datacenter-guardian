import { Server } from '@/types/server';
import { ServerConnection } from '@/types/redfish';
import { RedfishClient } from './redfishClient';

// Storage key for connections
const CONNECTIONS_STORAGE_KEY = 'datacenter-connections';

class ServerPollingService {
  private connections: Map<string, ServerConnection> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private serverData: Map<string, Server> = new Map();
  private listeners: Set<(servers: Server[]) => void> = new Set();
  private errorListeners: Set<(connectionId: string, error: string) => void> = new Set();

  constructor() {
    this.loadConnections();
  }

  // Load saved connections from localStorage
  private loadConnections(): void {
    try {
      const saved = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
      if (saved) {
        const connections: ServerConnection[] = JSON.parse(saved);
        connections.forEach(conn => {
          this.connections.set(conn.id, conn);
          if (conn.enabled) {
            this.startPolling(conn.id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  }

  // Save connections to localStorage
  private saveConnections(): void {
    try {
      const connections = Array.from(this.connections.values());
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
    } catch (error) {
      console.error('Failed to save connections:', error);
    }
  }

  // Add a new server connection
  addConnection(connection: Omit<ServerConnection, 'id'>): ServerConnection {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newConnection: ServerConnection = { ...connection, id };
    this.connections.set(id, newConnection);
    this.saveConnections();
    
    if (newConnection.enabled) {
      this.startPolling(id);
    }
    
    return newConnection;
  }

  // Update an existing connection
  updateConnection(id: string, updates: Partial<ServerConnection>): void {
    const existing = this.connections.get(id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    this.connections.set(id, updated);
    this.saveConnections();

    // Restart polling if enabled status or interval changed
    this.stopPolling(id);
    if (updated.enabled) {
      this.startPolling(id);
    }
  }

  // Remove a connection
  removeConnection(id: string): void {
    this.stopPolling(id);
    this.connections.delete(id);
    this.serverData.delete(id);
    this.saveConnections();
    this.notifyListeners();
  }

  // Get all connections
  getConnections(): ServerConnection[] {
    return Array.from(this.connections.values());
  }

  // Get a specific connection
  getConnection(id: string): ServerConnection | undefined {
    return this.connections.get(id);
  }

  // Start polling a connection
  private startPolling(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;

    // Poll immediately
    this.pollServer(id);

    // Set up interval
    const interval = setInterval(() => {
      this.pollServer(id);
    }, connection.pollInterval * 1000);

    this.pollingIntervals.set(id, interval);
  }

  // Stop polling a connection
  private stopPolling(id: string): void {
    const interval = this.pollingIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(id);
    }
  }

  // Poll a single server
  private async pollServer(id: string): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) return;

    try {
      const client = new RedfishClient(connection);
      const serverData = await client.fetchServerData();
      
      // Merge with existing data or create new
      const existing = this.serverData.get(id);
      const updated: Server = {
        id,
        hostname: serverData.hostname || connection.name,
        ipmiIp: connection.host,
        managementType: serverData.managementType || 'IPMI',
        status: serverData.status || 'online',
        location: serverData.location || { datacenter: 'Unknown', rack: 'Unknown', unit: 0 },
        hardware: serverData.hardware || { manufacturer: 'Unknown', model: 'Unknown', serialNumber: 'Unknown', biosVersion: 'Unknown' },
        specs: serverData.specs || { cpu: 'Unknown', cpuCores: 0, memory: 'Unknown', storage: [] },
        network: serverData.network || [],
        metrics: serverData.metrics || { cpuUsage: 0, memoryUsage: 0, temperature: 0, fanSpeed: 0, powerConsumption: 0 },
        lastSeen: new Date(),
        tags: existing?.tags || [connection.type],
      };

      this.serverData.set(id, updated);
      
      // Update connection last polled time
      connection.lastPolled = new Date();
      connection.lastError = undefined;
      this.connections.set(id, connection);
      
      this.notifyListeners();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Polling failed for ${connection.name}:`, errorMessage);
      
      // Update connection with error
      connection.lastError = errorMessage;
      this.connections.set(id, connection);
      
      // Mark server as potentially offline
      const existing = this.serverData.get(id);
      if (existing) {
        existing.status = 'offline';
        existing.lastSeen = existing.lastSeen; // Keep last successful time
        this.serverData.set(id, existing);
      }
      
      this.notifyErrorListeners(id, errorMessage);
      this.notifyListeners();
    }
  }

  // Force poll all servers
  async pollAll(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map(id => this.pollServer(id));
    await Promise.allSettled(promises);
  }

  // Force poll a specific server
  async pollOne(id: string): Promise<void> {
    await this.pollServer(id);
  }

  // Get all server data
  getServers(): Server[] {
    return Array.from(this.serverData.values());
  }

  // Subscribe to server data updates
  subscribe(listener: (servers: Server[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current data
    listener(this.getServers());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Subscribe to errors
  subscribeToErrors(listener: (connectionId: string, error: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const servers = this.getServers();
    this.listeners.forEach(listener => listener(servers));
  }

  private notifyErrorListeners(connectionId: string, error: string): void {
    this.errorListeners.forEach(listener => listener(connectionId, error));
  }

  // Test a connection without adding it
  async testConnection(connection: Omit<ServerConnection, 'id'>): Promise<{ success: boolean; message: string; data?: Partial<Server> }> {
    try {
      const testConn: ServerConnection = { ...connection, id: 'test' };
      const client = new RedfishClient(testConn);
      const root = await client.getRoot();
      const serverData = await client.fetchServerData();
      
      return {
        success: true,
        message: `Connected successfully! Redfish version: ${root.RedfishVersion}`,
        data: serverData,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // Cleanup
  destroy(): void {
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    this.listeners.clear();
    this.errorListeners.clear();
  }
}

// Singleton instance
export const serverPollingService = new ServerPollingService();
