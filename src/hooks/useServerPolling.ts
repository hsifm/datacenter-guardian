import { useState, useEffect, useCallback } from 'react';
import { Server } from '@/types/server';
import { ServerConnection } from '@/types/redfish';
import { serverPollingService } from '@/services/serverPollingService';
import { mockServers } from '@/data/mockServers';

interface UseServerPollingOptions {
  includeMockData?: boolean;
}

export function useServerPolling(options: UseServerPollingOptions = {}) {
  const { includeMockData = true } = options;
  
  const [liveServers, setLiveServers] = useState<Server[]>([]);
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Subscribe to server updates
    const unsubscribe = serverPollingService.subscribe((servers) => {
      setLiveServers(servers);
    });

    // Subscribe to errors
    const unsubscribeErrors = serverPollingService.subscribeToErrors((connectionId, error) => {
      setErrors(prev => new Map(prev).set(connectionId, error));
    });

    // Load initial connections
    setConnections(serverPollingService.getConnections());

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  // Combine live servers with mock data if enabled
  const allServers = includeMockData 
    ? [...mockServers, ...liveServers]
    : liveServers;

  const addConnection = useCallback((connection: Omit<ServerConnection, 'id'>) => {
    const newConn = serverPollingService.addConnection(connection);
    setConnections(serverPollingService.getConnections());
    return newConn;
  }, []);

  const updateConnection = useCallback((id: string, updates: Partial<ServerConnection>) => {
    serverPollingService.updateConnection(id, updates);
    setConnections(serverPollingService.getConnections());
  }, []);

  const removeConnection = useCallback((id: string) => {
    serverPollingService.removeConnection(id);
    setConnections(serverPollingService.getConnections());
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const refreshAll = useCallback(async () => {
    setIsPolling(true);
    try {
      await serverPollingService.pollAll();
    } finally {
      setIsPolling(false);
    }
  }, []);

  const refreshOne = useCallback(async (id: string) => {
    setIsPolling(true);
    try {
      await serverPollingService.pollOne(id);
      // Clear error for this connection
      setErrors(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } finally {
      setIsPolling(false);
    }
  }, []);

  const testConnection = useCallback(async (connection: Omit<ServerConnection, 'id'>) => {
    return serverPollingService.testConnection(connection);
  }, []);

  return {
    servers: allServers,
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
  };
}
