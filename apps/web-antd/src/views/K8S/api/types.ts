/** K8s集群 */
export interface K8sCluster {
  id: number;
  uid: string;
  name: string;
  description?: string;
  apiServerUrl?: string;
  version?: string;
  nodeCount: number;
  namespaceCount: number;
  status: string;
  provider?: string;
  networkPlugin?: string;
  containerRuntime?: string;
  createdAt: string;
  updatedAt: string;
}

/** 集群组件 */
export interface K8sClusterComponent {
  id: number;
  clusterId: number;
  componentName: string;
  componentType: string;
  status: string;
  message?: string;
  checkedAt: string;
}

/** 集群资源指标 */
export interface K8sClusterMetrics {
  id: number;
  clusterId: number;
  cpuCapacity: number;
  cpuUsed: number;
  memoryCapacity: number;
  memoryUsed: number;
  podCapacity: number;
  podUsed: number;
  storageCapacity: number;
  storageUsed: number;
  snapshotTime: string;
}

/** 集群总览 */
export interface K8sClusterOverview {
  cluster: K8sCluster;
  totalNodes: number;
  readyNodes: number;
  namespaceCount: number;
  deploymentCount: number;
  statefulSetCount: number;
  daemonSetCount: number;
  totalPods: number;
  runningPods: number;
  serviceCount: number;
  k8sVersion: string;
  cpuCapacity: number;
  cpuUsed: number;
  memoryCapacity: number;
  memoryUsed: number;
  podCapacity: number;
  podUsed: number;
  storageCapacity: number;
  storageUsed?: number;
}

/** 节点信息 */
export interface K8sNode {
  name: string;
  status: string;
  roles: string[];
  internalIP?: string;
  hostname?: string;
  cpuCapacity?: string;
  memoryCapacity?: string;
  podCapacity?: string;
  osImage?: string;
  kernelVersion?: string;
  containerRuntime?: string;
  kubeletVersion?: string;
  architecture?: string;
  labels?: Record<string, string>;
  unschedulable?: boolean;
  createdAt?: string;
}

/** 节点排名 */
export interface K8sNodeRanking {
  name: string;
  ip?: string;
  roles: string[];
  cpuCapacity: number;
  cpuUsed: number;
  cpuPercent: number;
  memoryCapacity: number;
  memoryUsed: number;
  memoryPercent: number;
  podCapacity: number;
  podUsed: number;
  podPercent: number;
}

/** K8s事件 */
export interface K8sEvent {
  namespace: string;
  type: string;
  reason: string;
  message: string;
  kind: string;
  name: string;
  lastTimestamp: string;
  count: number;
  source: string;
}

/** 命名空间 */
export interface K8sNamespace {
  name: string;
  status: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  podCount: number;
  deploymentCount: number;
  serviceCount: number;
  createdAt: string;
}

/** 命名空间概览 */
export interface K8sNamespaceOverview {
  podCount: number;
  runningPods: number;
  deploymentCount: number;
  statefulSetCount: number;
  daemonSetCount: number;
  serviceCount: number;
  jobCount: number;
  cronJobCount: number;
  configMapCount: number;
  secretCount: number;
  ingressCount: number;
}

/** 工作负载（通用） */
export interface K8sWorkload {
  name: string;
  namespace: string;
  kind: string;
  replicas: number;
  readyReplicas: number;
  updatedReplicas?: number;
  availableReplicas?: number;
  status: string;
  images: string[];
  createdAt: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  containers?: K8sContainerInfo[];
  yaml?: string;
}

/** 容器信息 */
export interface K8sContainerInfo {
  name: string;
  image: string;
  imagePullPolicy?: string;
  ports?: Array<{ containerPort: number; name?: string; protocol?: string }>;
  resources?: {
    limits?: Record<string, string>;
    requests?: Record<string, string>;
  };
  env?: Array<{ name: string; value?: string }>;
}

/** Pod */
export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  podIP?: string;
  hostIP?: string;
  nodeName?: string;
  ready: string;
  readyCount: number;
  totalContainers: number;
  restarts: number;
  images: string[];
  createdAt: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  containers?: K8sContainerDetail[];
  conditions?: K8sPodCondition[];
  volumes?: Array<{ name: string; type: string; claimName?: string; path?: string }>;
  ownerReferences?: Array<{ kind: string; name: string }>;
  yaml?: string;
}

/** 容器详细信息 */
export interface K8sContainerDetail extends K8sContainerInfo {
  ready?: boolean;
  restartCount?: number;
  started?: boolean;
  state?: string;
  startedAt?: string;
  waitingReason?: string;
  waitingMessage?: string;
  terminatedReason?: string;
  exitCode?: number;
  containerID?: string;
  isInit?: boolean;
  volumeMounts?: Array<{ mountPath: string; name: string; readOnly?: boolean; subPath?: string }>;
}

/** Pod条件 */
export interface K8sPodCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

/** Job */
export interface K8sJob {
  name: string;
  namespace: string;
  kind: string;
  status: string;
  active: number;
  succeeded: number;
  failed: number;
  startTime?: string;
  completionTime?: string;
  images: string[];
  createdAt: string;
  labels?: Record<string, string>;
  containers?: K8sContainerInfo[];
  yaml?: string;
}

/** CronJob */
export interface K8sCronJob {
  name: string;
  namespace: string;
  kind: string;
  schedule: string;
  suspend: boolean;
  status: string;
  lastScheduleTime?: string;
  lastSuccessfulTime?: string;
  activeJobs: number;
  images: string[];
  createdAt: string;
  labels?: Record<string, string>;
  containers?: K8sContainerInfo[];
  recentJobs?: K8sJob[];
  yaml?: string;
}

/** Deployment修订记录 */
export interface K8sRevision {
  revision: number;
  name: string;
  replicas: number;
  readyReplicas: number;
  images: string[];
  createdAt: string;
}

/** 资源配额 */
export interface K8sResourceQuota {
  name: string;
  hard?: Record<string, string>;
  used?: Record<string, string>;
  createdAt: string;
}
