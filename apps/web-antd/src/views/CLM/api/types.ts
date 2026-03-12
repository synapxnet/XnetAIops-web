export interface Cluster {
  id: number;
  uid: string;
  clusterName: string;
  clusterCode: string;
  description: string;
  clusterType: string;
  status: string;
  totalHosts: number;
  runningServices: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClusterVariable {
  id: number;
  clusterId: number;
  variableName: string;
  variableValue: string;
}

export interface ClusterOverview {
  cluster: Cluster;
  totalHosts: number;
  runningServices: number;
}

// ==================== MySQL Instance ====================

export interface MySQLInstance {
  id: number;
  uid: string;
  instanceName: string;
  clusterId: number;
  host: string;
  sshPort: number;
  sshUser: string;
  authType: string;
  encryptedPassword: string;
  encryptedPrivateKey: string;
  mysqlPort: number;
  mysqlVersion: string;
  dataDir: string;
  charset: string;
  innodbBufferPoolSize: number;
  maxConnections: number;
  encryptedRootPassword: string;
  role: string;
  masterInstanceId: number;
  serverId: number;
  status: string;
  deployLog: string;
  lastHeartbeat: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MySQLDeployConfig {
  mysqlVersion: string;
  mysqlPort: number;
  dataDir: string;
  rootPassword: string;
  charset: string;
  innodbBufferPoolSize: number;
  maxConnections: number;
  role: string;
  serverId: number;
  masterHost?: string;
  masterPort?: number;
  replUser?: string;
  replPassword?: string;
}

// ==================== Redis Instance ====================

export interface RedisInstance {
  id: number;
  uid: string;
  instanceName: string;
  clusterId: number;
  host: string;
  sshPort: number;
  sshUser: string;
  authType: string;
  encryptedPassword: string;
  encryptedPrivateKey: string;
  redisPort: number;
  redisVersion: string;
  encryptedRedisPassword: string;
  maxMemory: number;
  maxMemoryPolicy: string;
  persistenceMode: string;
  dataDir: string;
  deployMode: string;
  role: string;
  masterInstanceId: number;
  clusterBusPort: number;
  status: string;
  deployLog: string;
  lastHeartbeat: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedisDeployConfig {
  redisVersion: string;
  redisPort: number;
  redisPassword: string;
  maxMemory: number;
  maxMemoryPolicy: string;
  persistenceMode: string;
  dataDir: string;
  deployMode: string;
  role: string;
  masterHost?: string;
  masterPort?: number;
  masterPassword?: string;
  sentinelMasterName?: string;
  sentinelQuorum?: number;
}

// ==================== Hadoop Cluster ====================

export interface HadoopCluster {
  id: number;
  uid: string;
  name: string;
  description: string;
  host: string;
  port: number;
  sshUser: string;
  sshPassword: string;
  sshPrivateKey: string;
  hadoopVersion: string;
  osType: string;
  nodeType: string;
  deployMode: string;
  components: string;
  hdfsDataDirs: string;
  hdfsReplication: number;
  hdfsBlockSize: number;
  yarnMemory: number;
  yarnCpu: number;
  haMasterHost: string;
  zkCluster: string;
  status: string;
  deployLog: string;
  masterId: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HadoopDeployConfig {
  hadoopVersion: string;
  osType: string;
  deployMode: string;
  javaVersion: string;
  components: string[];
  hdfsDataDirs: string[];
  hdfsReplication: number;
  hdfsBlockSize: number;
  yarnMemory: number;
  yarnCpu: number;
  namenodePort?: number;
  datanodePort?: number;
  resourceManagerPort?: number;
  nodeManagerPort?: number;
}

// ==================== Hadoop Version ====================

export interface HadoopVersion {
  id: number;
  version: string;
  versionType: string;
  releaseDate: string;
  downloadUrl: string;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== Jenkins Master ====================

export interface JenkinsMaster {
  id?: number;
  uid?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encrypted_password?: string;
  password?: string;
  os_type: 'linux' | 'macos' | 'windows';
  jenkins_port?: number;
  jenkins_home?: string;
  jenkins_version?: string;
  java_version?: string;
  java_opts?: string;
  admin_username?: string;
  encrypted_admin_password?: string;
  admin_password?: string;
  credentials_config?: string;
  status?: 'pending' | 'deploying' | 'deployed' | 'failed' | 'running' | 'stopped';
  initial_password?: string;
  deploy_log?: string;
  last_heartbeat?: string;
  region?: string;
  cpu_cores?: number;
  ram_gb?: number;
  disk_gb?: number;
  host_id?: number;
  tenant_uid?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JenkinsMasterDeployConfig {
  jenkinsVersion: string;
  jenkinsPort: number;
  jenkinsHome: string;
  javaVersion: string;
  javaOpts: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail?: string;
  installSuggestedPlugins?: boolean;
  timezone?: string;
  gitCredentials?: Array<{ id: string; description: string; username: string; password: string }>;
  harborCredentials?: Array<{ id: string; description: string; url: string; username: string; password: string }>;
  sshCredentials?: Array<{ id: string; description: string; username: string; privateKey: string; passphrase?: string }>;
}

// ==================== Jenkins Node ====================

export interface JenkinsNode {
  id?: number;
  uid?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encrypted_password?: string;
  password?: string;
  os_type: 'linux' | 'macos' | 'windows';
  region?: string;
  container_type?: string;
  resource_type?: string;
  resource_spec?: string;
  cpu_cores?: number;
  ram_gb?: number;
  gpu_memory?: number;
  gpu_model?: string;
  gpu_count?: number;
  status?: 'pending' | 'deploying' | 'deployed' | 'failed' | 'running' | 'stopped' | 'offline';
  jenkins_url?: string;
  agent_name?: string;
  work_dir?: string;
  java_version?: string;
  python_version?: string;
  agent_version?: string;
  labels?: string;
  description?: string;
  deploy_log?: string;
  last_heartbeat?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JenkinsNodeDeployConfig {
  jenkinsUrl: string;
  agentName: string;
  workDir: string;
  javaVersion: string;
  pythonVersion?: string;
  agentVersion?: string;
  labels?: string;
  jenkinsSecret?: string;
  installDocker?: boolean;
  installGit?: boolean;
  installMaven?: boolean;
  installNodejs?: boolean;
  useMirror?: boolean;
}

// ==================== Jenkins Version ====================

export interface JenkinsVersion {
  id: number;
  version: string;
  versionType: string;
  releaseDate: string;
  downloadUrl: string;
  sha256: string;
  isLts: boolean;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}
