export interface Framework {
  id: number;
  frameName: string;
  frameCode: string;
  frameVersion: string;
  description: string;
  createdAt: string;
}

export interface ServiceDef {
  id: number;
  frameworkId: number;
  serviceName: string;
  serviceLabel: string;
  serviceVersion: string;
  description: string;
  dependencies: string;
  packageName: string;
  configJson: string;
  sortOrder: number;
}

export interface RoleDef {
  id: number;
  serviceDefId: number;
  roleName: string;
  roleType: string;
  cardinality: string;
  jmxPort: number;
  logFile: string;
}

export interface ServiceInstance {
  id: number;
  uid: string;
  clusterId: number;
  serviceDefId: number;
  serviceName: string;
  status: string;
  configJson: string;
  configVersion: number;
  needRestart: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleInstance {
  id: number;
  uid: string;
  serviceInstanceId: number;
  roleDefId: number;
  roleName: string;
  roleType: string;
  hostId: number;
  hostname: string;
  status: string;
  needRestart: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Command {
  id: number;
  uid: string;
  clusterId: number;
  commandName: string;
  commandType: string;
  status: string;
  progress: number;
  serviceInstanceId: number;
  createdBy: string;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}

export interface CommandHost {
  id: number;
  commandId: number;
  hostId: number;
  hostname: string;
  status: string;
  progress: number;
  resultMsg: string;
  roles?: CommandHostRole[];
}

export interface CommandHostRole {
  id: number;
  commandHostId: number;
  roleName: string;
  roleType: string;
  status: string;
  resultMsg: string;
  startedAt: string;
  finishedAt: string;
}
