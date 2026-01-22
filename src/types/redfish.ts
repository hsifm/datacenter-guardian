// Redfish API response types based on DMTF Redfish standard

export interface RedfishRoot {
  '@odata.id': string;
  '@odata.type': string;
  Id: string;
  Name: string;
  RedfishVersion: string;
  UUID?: string;
  Systems?: { '@odata.id': string };
  Chassis?: { '@odata.id': string };
  Managers?: { '@odata.id': string };
}

export interface RedfishCollection<T = RedfishResource> {
  '@odata.id': string;
  '@odata.type': string;
  Name: string;
  Members: { '@odata.id': string }[];
  'Members@odata.count': number;
}

export interface RedfishResource {
  '@odata.id': string;
  '@odata.type': string;
  Id: string;
  Name: string;
}

export interface RedfishSystem extends RedfishResource {
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  PartNumber?: string;
  UUID?: string;
  HostName?: string;
  PowerState?: 'On' | 'Off' | 'PoweringOn' | 'PoweringOff';
  Status?: RedfishStatus;
  IndicatorLED?: 'Lit' | 'Blinking' | 'Off';
  BiosVersion?: string;
  ProcessorSummary?: {
    Count: number;
    Model: string;
    Status?: RedfishStatus;
  };
  MemorySummary?: {
    TotalSystemMemoryGiB: number;
    Status?: RedfishStatus;
  };
  Boot?: {
    BootSourceOverrideEnabled?: string;
    BootSourceOverrideTarget?: string;
  };
  Processors?: { '@odata.id': string };
  Memory?: { '@odata.id': string };
  Storage?: { '@odata.id': string };
  EthernetInterfaces?: { '@odata.id': string };
}

export interface RedfishStatus {
  State?: 'Enabled' | 'Disabled' | 'StandbyOffline' | 'StandbySpare' | 'InTest' | 'Starting' | 'Absent' | 'UnavailableOffline' | 'Deferring' | 'Quiesced' | 'Updating';
  Health?: 'OK' | 'Warning' | 'Critical';
  HealthRollup?: 'OK' | 'Warning' | 'Critical';
}

export interface RedfishChassis extends RedfishResource {
  ChassisType?: string;
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  PartNumber?: string;
  Status?: RedfishStatus;
  IndicatorLED?: 'Lit' | 'Blinking' | 'Off';
  Power?: { '@odata.id': string };
  Thermal?: { '@odata.id': string };
  Location?: {
    Placement?: {
      Rack?: string;
      Row?: string;
    };
  };
}

export interface RedfishThermal extends RedfishResource {
  Temperatures: RedfishTemperature[];
  Fans: RedfishFan[];
}

export interface RedfishTemperature {
  '@odata.id': string;
  MemberId: string;
  Name: string;
  ReadingCelsius: number;
  Status?: RedfishStatus;
  UpperThresholdCritical?: number;
  UpperThresholdWarning?: number;
  UpperThresholdFatal?: number;
  PhysicalContext?: string;
}

export interface RedfishFan {
  '@odata.id': string;
  MemberId: string;
  Name: string;
  Reading?: number;
  ReadingUnits?: 'RPM' | 'Percent';
  Status?: RedfishStatus;
  PhysicalContext?: string;
}

export interface RedfishPower extends RedfishResource {
  PowerControl: RedfishPowerControl[];
  Voltages?: RedfishVoltage[];
  PowerSupplies?: RedfishPowerSupply[];
}

export interface RedfishPowerControl {
  '@odata.id': string;
  MemberId: string;
  Name: string;
  PowerConsumedWatts?: number;
  PowerCapacityWatts?: number;
  PowerLimit?: {
    LimitInWatts?: number;
    LimitException?: string;
  };
  Status?: RedfishStatus;
}

export interface RedfishVoltage {
  '@odata.id': string;
  MemberId: string;
  Name: string;
  ReadingVolts?: number;
  Status?: RedfishStatus;
}

export interface RedfishPowerSupply {
  '@odata.id': string;
  MemberId: string;
  Name: string;
  Status?: RedfishStatus;
  PowerCapacityWatts?: number;
  PowerOutputWatts?: number;
  Model?: string;
  SerialNumber?: string;
}

export interface RedfishProcessor extends RedfishResource {
  Socket?: string;
  ProcessorType?: string;
  ProcessorArchitecture?: string;
  InstructionSet?: string;
  Manufacturer?: string;
  Model?: string;
  MaxSpeedMHz?: number;
  TotalCores?: number;
  TotalThreads?: number;
  Status?: RedfishStatus;
}

export interface RedfishMemory extends RedfishResource {
  MemoryDeviceType?: string;
  CapacityMiB?: number;
  OperatingSpeedMhz?: number;
  Manufacturer?: string;
  PartNumber?: string;
  SerialNumber?: string;
  Status?: RedfishStatus;
}

export interface RedfishStorage extends RedfishResource {
  Drives?: { '@odata.id': string }[];
  StorageControllers?: RedfishStorageController[];
}

export interface RedfishStorageController {
  '@odata.id': string;
  MemberId: string;
  Name: string;
  Manufacturer?: string;
  Model?: string;
  Status?: RedfishStatus;
  SupportedDeviceProtocols?: string[];
}

export interface RedfishDrive extends RedfishResource {
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  CapacityBytes?: number;
  MediaType?: 'HDD' | 'SSD' | 'SMR';
  Protocol?: 'SATA' | 'SAS' | 'NVMe';
  RotationSpeedRPM?: number;
  Status?: RedfishStatus;
  PredictedMediaLifeLeftPercent?: number;
}

export interface RedfishEthernetInterface extends RedfishResource {
  MACAddress?: string;
  SpeedMbps?: number;
  FullDuplex?: boolean;
  AutoNeg?: boolean;
  Status?: RedfishStatus;
  LinkStatus?: 'LinkUp' | 'LinkDown' | 'NoLink';
  IPv4Addresses?: {
    Address: string;
    SubnetMask: string;
    Gateway?: string;
    AddressOrigin?: string;
  }[];
}

// Connection configuration
export interface ServerConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'https' | 'http';
  username: string;
  password: string;
  type: 'redfish' | 'idrac' | 'ilo' | 'ipmi';
  enabled: boolean;
  pollInterval: number; // seconds
  lastPolled?: Date;
  lastError?: string;
}
