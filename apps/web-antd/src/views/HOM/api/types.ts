export interface Host {
  id: number;
  uid: string;
  clusterId: number;
  hostname: string;
  ipAddress: string;
  sshPort: number;
  sshUser: string;
  authType: string;
  encryptedPassword?: string;
  privateKey?: string;
  osType: string;
  osVersion: string;
  cpuArch: string;
  cpuCores: number;
  totalMemGb: number;
  totalDiskGb: number;
  usedMemGb: number;
  usedDiskGb: number;
  cpuUsage: number;
  rack: string;
  nodeLabel: string;
  status: string;
  agentStatus: string;
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rack {
  id: number;
  clusterId: number;
  rackName: string;
  description: string;
}

export interface SshTestResult {
  success: boolean;
  message: string;
  osInfo?: string;
  cpuCores?: string;
  totalMemGb?: string;
  totalDiskGb?: string;
  cpuArch?: string;
}
