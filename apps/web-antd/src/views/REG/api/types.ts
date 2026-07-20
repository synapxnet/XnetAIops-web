export interface Registry {
  id: number;
  uid: string;
  registryName: string;
  registryType: 'harbor' | 'gitlab' | 'docker_distribution';
  description: string;
  version: string;
  status: string;
  deployMode: 'ssh' | 'k8s';
  // SSH fields
  hostId: number | null;
  host: string;
  sshPort: number;
  sshUser: string;
  encryptedPassword: string;
  encryptedPrivateKey: string;
  installPath: string;
  servicePort: number | null;
  // K8s fields
  clusterId: number | null;
  namespace: string;
  releaseName: string;
  helmValues: string;
  // Access info
  endpoint: string;
  apiUrl: string;
  adminUser: string;
  encryptedAdminPassword: string;
  useSsl: boolean;
  certPem: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeployLog {
  id: number;
  registryId: number;
  action: string;
  status: string;
  logText: string;
  startedAt: string;
  finishedAt: string;
}

export interface RegistryProject {
  id: number;
  registryId: number;
  projectName: string;
  visibility: string;
  repoCount: number;
  createdAt: string;
}

export interface Repository {
  id: number;
  registryId: number;
  projectId: number;
  repoName: string;
  tagsCount: number;
  pullCount: number;
  latestTag: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  repositoryId: number;
  tagName: string;
  digest: string;
  sizeBytes: number;
  architecture: string;
  os: string;
  pushedAt: string;
}

export interface RegistryEndpoint {
  id: number;
  name: string;
  url: string;
  type: string;
  description: string;
  insecure: boolean;
  credential: {
    type: string;
    access_key: string;
    access_secret: string;
  };
  status: string;
  creation_time: string;
  update_time: string;
}

export interface ReplicationPolicy {
  id: number;
  name: string;
  description: string;
  src_registry: { id: number; name?: string; url?: string };
  dest_namespace: string;
  dest_namespace_replace_count: number;
  filters: Array<{ type: string; value: string }>;
  trigger: { type: string; trigger_settings?: { cron?: string } };
  enabled: boolean;
  creation_time: string;
  update_time: string;
}

export interface ReplicationExecution {
  id: number;
  policy_id: number;
  status: string;
  trigger: string;
  start_time: string;
  end_time: string;
  succeed: number;
  failed: number;
  in_progress: number;
  stopped: number;
  total: number;
  status_text: string;
}

export interface ReplicationTask {
  id: number;
  execution_id: number;
  resource_type: string;
  src_resource: string;
  dst_resource: string;
  status: string;
  start_time: string;
  end_time: string;
}

export interface QuickSyncRequest {
  image: string;
  targetProject: string;
  endpointId?: number;
}
