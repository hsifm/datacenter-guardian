export type ServerStatus = 'online' | 'offline' | 'warning' | 'maintenance';

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
  fanSpeed: number;
  powerConsumption: number;
}

export interface NetworkInterface {
  name: string;
  mac: string;
  ip: string;
  speed: string;
  status: 'up' | 'down';
}

export interface StorageDevice {
  name: string;
  type: 'SSD' | 'HDD' | 'NVMe';
  capacity: string;
  health: 'healthy' | 'warning' | 'critical';
}

export interface Server {
  id: string;
  hostname: string;
  ipmiIp: string;
  managementType: 'IPMI' | 'iDRAC' | 'iLO' | 'IMM';
  status: ServerStatus;
  location: {
    datacenter: string;
    rack: string;
    unit: number;
  };
  hardware: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    biosVersion: string;
  };
  specs: {
    cpu: string;
    cpuCores: number;
    memory: string;
    storage: StorageDevice[];
  };
  network: NetworkInterface[];
  metrics: ServerMetrics;
  lastSeen: Date;
  tags: string[];
}
