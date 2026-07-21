import type {
  K8sCluster,
  K8sNamespace,
  K8sNode,
  K8sWorkload,
} from './api/types';

export const demoK8sNodes: K8sNode[] = [
  {
    name: 'demo-edge-control-01',
    status: 'Ready',
    roles: ['control-plane'],
    internalIP: '192.168.120.11',
    cpuCapacity: '8',
    memoryCapacity: '16777216',
    containerRuntime: 'containerd://1.7.20',
    kubeletVersion: 'v1.30.8',
    unschedulable: false,
    createdAt: '2026-04-17T08:30:00Z',
  },
  {
    name: 'demo-edge-worker-01',
    status: 'Ready',
    roles: ['worker'],
    internalIP: '192.168.120.21',
    cpuCapacity: '16',
    memoryCapacity: '33554432',
    containerRuntime: 'containerd://1.7.20',
    kubeletVersion: 'v1.30.8',
    unschedulable: false,
    createdAt: '2026-04-17T08:42:00Z',
  },
  {
    name: 'demo-edge-worker-02',
    status: 'Ready',
    roles: ['worker'],
    internalIP: '192.168.120.22',
    cpuCapacity: '16',
    memoryCapacity: '33554432',
    containerRuntime: 'containerd://1.7.20',
    kubeletVersion: 'v1.30.8',
    unschedulable: false,
    createdAt: '2026-04-17T08:48:00Z',
  },
];

export const demoK8sNamespaces: K8sNamespace[] = [
  { name: 'default', status: 'Active', podCount: 8, deploymentCount: 2, serviceCount: 3, createdAt: '2026-04-17T08:30:00Z' },
  { name: 'data-services', status: 'Active', podCount: 6, deploymentCount: 2, serviceCount: 2, createdAt: '2026-04-17T09:10:00Z' },
  { name: 'observability', status: 'Active', podCount: 7, deploymentCount: 2, serviceCount: 4, createdAt: '2026-04-17T09:18:00Z' },
  { name: 'platform-system', status: 'Active', podCount: 5, deploymentCount: 1, serviceCount: 2, createdAt: '2026-04-17T08:55:00Z' },
];

const demoDeployments: K8sWorkload[] = [
  { name: 'edge-api-gateway', namespace: 'default', kind: 'Deployment', replicas: 3, readyReplicas: 3, status: 'Running', images: ['registry.demo.example/platform/edge-gateway:1.8.2'], createdAt: '2026-06-12T03:20:00Z' },
  { name: 'customer-portal', namespace: 'default', kind: 'Deployment', replicas: 2, readyReplicas: 2, status: 'Running', images: ['registry.demo.example/apps/customer-portal:2.4.1'], createdAt: '2026-06-20T06:15:00Z' },
  { name: 'event-router', namespace: 'data-services', kind: 'Deployment', replicas: 3, readyReplicas: 3, status: 'Running', images: ['registry.demo.example/data/event-router:1.6.0'], createdAt: '2026-05-28T04:40:00Z' },
  { name: 'telemetry-collector', namespace: 'observability', kind: 'Deployment', replicas: 2, readyReplicas: 2, status: 'Running', images: ['otel/opentelemetry-collector:0.128.0'], createdAt: '2026-05-18T11:25:00Z' },
];

const demoStatefulSets: K8sWorkload[] = [
  { name: 'edge-cache', namespace: 'default', kind: 'StatefulSet', replicas: 1, readyReplicas: 1, status: 'Running', images: ['redis:7.4-alpine'], createdAt: '2026-06-12T03:25:00Z' },
  { name: 'metrics-store', namespace: 'observability', kind: 'StatefulSet', replicas: 2, readyReplicas: 2, status: 'Running', images: ['victoriametrics/victoria-metrics:v1.116.0'], createdAt: '2026-05-18T11:30:00Z' },
];

const demoDaemonSets: K8sWorkload[] = [
  { name: 'edge-log-agent', namespace: 'default', kind: 'DaemonSet', replicas: 3, readyReplicas: 3, status: 'Running', images: ['fluent/fluent-bit:4.0.3'], createdAt: '2026-04-17T10:05:00Z' },
  { name: 'node-exporter', namespace: 'observability', kind: 'DaemonSet', replicas: 3, readyReplicas: 3, status: 'Running', images: ['prom/node-exporter:v1.9.1'], createdAt: '2026-05-18T11:35:00Z' },
];

export function isDemoK8sCluster(
  clusters: K8sCluster[],
  clusterId: number | null,
) {
  return clusters.some(
    (cluster) => cluster.id === clusterId && cluster.uid.startsWith('demo-aiops-'),
  );
}

export function getDemoWorkloads(namespace: string) {
  return {
    deployments: demoDeployments.filter((item) => item.namespace === namespace),
    statefulSets: demoStatefulSets.filter((item) => item.namespace === namespace),
    daemonSets: demoDaemonSets.filter((item) => item.namespace === namespace),
  };
}
