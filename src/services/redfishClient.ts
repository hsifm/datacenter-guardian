import { 
  RedfishRoot, 
  RedfishSystem, 
  RedfishChassis, 
  RedfishThermal, 
  RedfishPower,
  RedfishProcessor,
  RedfishDrive,
  RedfishEthernetInterface,
  ServerConnection,
  RedfishCollection
} from '@/types/redfish';
import { Server, ServerStatus } from '@/types/server';

// Configuration for the CORS proxy
const PROXY_CONFIG = {
  // When running in Docker, use the proxy container
  // When running locally for development, you can use localhost
  proxyUrl: localStorage.getItem('redfishProxyUrl') || 'http://localhost:8443',
  enabled: localStorage.getItem('redfishProxyEnabled') !== 'false', // enabled by default
};

// Helper to configure proxy settings
export function configureProxy(proxyUrl: string, enabled: boolean = true) {
  localStorage.setItem('redfishProxyUrl', proxyUrl);
  localStorage.setItem('redfishProxyEnabled', String(enabled));
  PROXY_CONFIG.proxyUrl = proxyUrl;
  PROXY_CONFIG.enabled = enabled;
}

export function getProxyConfig() {
  return { ...PROXY_CONFIG };
}

class RedfishClient {
  private connection: ServerConnection;
  private baseUrl: string;
  private authHeader: string;

  constructor(connection: ServerConnection) {
    this.connection = connection;
    this.baseUrl = `${connection.protocol}://${connection.host}:${connection.port}`;
    this.authHeader = 'Basic ' + btoa(`${connection.username}:${connection.password}`);
  }

  private async fetch<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    let url: string;

    if (PROXY_CONFIG.enabled) {
      // Use the CORS proxy
      url = `${PROXY_CONFIG.proxyUrl}${path}`;
      headers['X-Target-Host'] = this.connection.host;
      headers['X-Target-Port'] = String(this.connection.port);
      headers['X-Target-Protocol'] = this.connection.protocol;
    } else {
      // Direct connection (only works if BMC has CORS configured)
      url = `${this.baseUrl}${path}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Redfish API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRoot(): Promise<RedfishRoot> {
    return this.fetch<RedfishRoot>('/redfish/v1');
  }

  async getSystems(): Promise<RedfishCollection<RedfishSystem>> {
    return this.fetch<RedfishCollection<RedfishSystem>>('/redfish/v1/Systems');
  }

  async getSystem(systemId: string = '1'): Promise<RedfishSystem> {
    return this.fetch<RedfishSystem>(`/redfish/v1/Systems/${systemId}`);
  }

  async getChassis(): Promise<RedfishCollection<RedfishChassis>> {
    return this.fetch<RedfishCollection<RedfishChassis>>('/redfish/v1/Chassis');
  }

  async getChassisById(chassisId: string = '1'): Promise<RedfishChassis> {
    return this.fetch<RedfishChassis>(`/redfish/v1/Chassis/${chassisId}`);
  }

  async getThermal(chassisId: string = '1'): Promise<RedfishThermal> {
    return this.fetch<RedfishThermal>(`/redfish/v1/Chassis/${chassisId}/Thermal`);
  }

  async getPower(chassisId: string = '1'): Promise<RedfishPower> {
    return this.fetch<RedfishPower>(`/redfish/v1/Chassis/${chassisId}/Power`);
  }

  async getProcessors(systemId: string = '1'): Promise<RedfishCollection<RedfishProcessor>> {
    return this.fetch<RedfishCollection<RedfishProcessor>>(`/redfish/v1/Systems/${systemId}/Processors`);
  }

  async getProcessor(systemId: string, processorId: string): Promise<RedfishProcessor> {
    return this.fetch<RedfishProcessor>(`/redfish/v1/Systems/${systemId}/Processors/${processorId}`);
  }

  async getEthernetInterfaces(systemId: string = '1'): Promise<RedfishCollection<RedfishEthernetInterface>> {
    return this.fetch<RedfishCollection<RedfishEthernetInterface>>(`/redfish/v1/Systems/${systemId}/EthernetInterfaces`);
  }

  async getEthernetInterface(systemId: string, interfaceId: string): Promise<RedfishEthernetInterface> {
    return this.fetch<RedfishEthernetInterface>(`/redfish/v1/Systems/${systemId}/EthernetInterfaces/${interfaceId}`);
  }

  async getDrive(storageId: string, driveId: string): Promise<RedfishDrive> {
    return this.fetch<RedfishDrive>(`/redfish/v1/Systems/1/Storage/${storageId}/Drives/${driveId}`);
  }

  // Power control actions
  async powerOn(systemId: string = '1'): Promise<void> {
    await this.postAction(systemId, 'On');
  }

  async powerOff(systemId: string = '1'): Promise<void> {
    await this.postAction(systemId, 'ForceOff');
  }

  async powerReset(systemId: string = '1'): Promise<void> {
    await this.postAction(systemId, 'ForceRestart');
  }

  async gracefulShutdown(systemId: string = '1'): Promise<void> {
    await this.postAction(systemId, 'GracefulShutdown');
  }

  private async postAction(systemId: string, resetType: string): Promise<void> {
    const path = `/redfish/v1/Systems/${systemId}/Actions/ComputerSystem.Reset`;
    const headers: Record<string, string> = {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    let url: string;

    if (PROXY_CONFIG.enabled) {
      url = `${PROXY_CONFIG.proxyUrl}${path}`;
      headers['X-Target-Host'] = this.connection.host;
      headers['X-Target-Port'] = String(this.connection.port);
      headers['X-Target-Protocol'] = this.connection.protocol;
    } else {
      url = `${this.baseUrl}${path}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ResetType: resetType }),
    });

    if (!response.ok) {
      throw new Error(`Power action failed: ${response.status} ${response.statusText}`);
    }
  }

  // Convert Redfish data to our Server model
  async fetchServerData(): Promise<Partial<Server>> {
    try {
      const [system, chassis, thermal, power] = await Promise.all([
        this.getSystem(),
        this.getChassisById(),
        this.getThermal(),
        this.getPower(),
      ]);

      // Map Redfish status to our status
      const mapStatus = (): ServerStatus => {
        if (system.PowerState === 'Off') return 'offline';
        if (system.Status?.Health === 'Critical') return 'offline';
        if (system.Status?.Health === 'Warning') return 'warning';
        if (system.PowerState === 'On') return 'online';
        return 'maintenance';
      };

      // Get primary temperature (usually CPU)
      const cpuTemp = thermal.Temperatures.find(t => 
        t.PhysicalContext?.toLowerCase().includes('cpu') ||
        t.Name.toLowerCase().includes('cpu')
      );

      // Get average fan speed
      const avgFanSpeed = thermal.Fans.length > 0
        ? thermal.Fans.reduce((acc, f) => acc + (f.Reading || 0), 0) / thermal.Fans.length
        : 0;

      // Get power consumption
      const powerConsumed = power.PowerControl[0]?.PowerConsumedWatts || 0;

      return {
        id: this.connection.id,
        hostname: system.HostName || this.connection.name,
        ipmiIp: this.connection.host,
        managementType: this.connection.type === 'idrac' ? 'iDRAC' : 
                        this.connection.type === 'ilo' ? 'iLO' : 'IPMI',
        status: mapStatus(),
        location: {
          datacenter: 'Unknown',
          rack: chassis.Location?.Placement?.Rack || 'Unknown',
          unit: 0,
        },
        hardware: {
          manufacturer: system.Manufacturer || chassis.Manufacturer || 'Unknown',
          model: system.Model || chassis.Model || 'Unknown',
          serialNumber: system.SerialNumber || chassis.SerialNumber || 'Unknown',
          biosVersion: system.BiosVersion || 'Unknown',
        },
        specs: {
          cpu: system.ProcessorSummary?.Model || 'Unknown',
          cpuCores: system.ProcessorSummary?.Count || 0,
          memory: `${system.MemorySummary?.TotalSystemMemoryGiB || 0}GB`,
          storage: [], // Would need additional API calls
        },
        network: [], // Would need additional API calls
        metrics: {
          cpuUsage: 0, // Redfish doesn't typically expose CPU usage %
          memoryUsage: 0, // Would need additional data
          temperature: cpuTemp?.ReadingCelsius || 0,
          fanSpeed: Math.round(avgFanSpeed),
          powerConsumption: powerConsumed,
        },
        lastSeen: new Date(),
        tags: [this.connection.type],
      };
    } catch (error) {
      console.error(`Failed to fetch data from ${this.connection.host}:`, error);
      throw error;
    }
  }
}

export { RedfishClient };
export type { ServerConnection };
