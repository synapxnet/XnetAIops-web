import { k8sRequestClient } from '#/api/request';

const base = (cid: number) => `/clusters/${cid}/monitoring`;

export function getClusterMetrics(clusterId: number, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/cluster`, { params: { start, end, step } });
}

export function getClusterStatus(clusterId: number) {
  return k8sRequestClient.get<any>(`${base(clusterId)}/cluster/status`);
}

export function getNodeMetrics(clusterId: number, nodeName: string, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/nodes/${nodeName}`, { params: { start, end, step } });
}

export function getNodeRanking(clusterId: number, metric = 'cpu', topN = 5) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/node-ranking`, { params: { metric, topN } });
}

export function getNamespaceMetrics(clusterId: number, namespace: string, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/namespaces/${namespace}`, { params: { start, end, step } });
}

export function getNamespaceRanking(clusterId: number, metric = 'cpu', topN = 5) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/namespace-ranking`, { params: { metric, topN } });
}

export function getWorkloadMetrics(clusterId: number, namespace: string, workload: string, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/namespaces/${namespace}/workloads/${workload}`, { params: { start, end, step } });
}

export function getPodMetrics(clusterId: number, namespace: string, podName: string, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/namespaces/${namespace}/pods/${podName}`, { params: { start, end, step } });
}

export function getApiServerMetrics(clusterId: number, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/api-server`, { params: { start, end, step } });
}

export function getEtcdMetrics(clusterId: number, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/etcd`, { params: { start, end, step } });
}

export function getSchedulerMetrics(clusterId: number, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any>(`${base(clusterId)}/scheduler`, { params: { start, end, step } });
}

export function customQuery(clusterId: number, promql: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/query`, { params: { promql } });
}

export function customQueryRange(clusterId: number, promql: string, start: number, end: number, step = '60') {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/query-range`, { params: { promql, start, end, step } });
}

// Prometheus config
export function getPrometheusConfig(clusterId: number) {
  return k8sRequestClient.get<any>(`${base(clusterId)}/config`);
}

export function savePrometheusConfig(clusterId: number, config: Record<string, string>) {
  return k8sRequestClient.post(`${base(clusterId)}/config`, config);
}

export function testPrometheusConnection(clusterId: number) {
  return k8sRequestClient.post<boolean>(`${base(clusterId)}/config/test`);
}

// Alerts
const alertBase = (cid: number) => `/clusters/${cid}/alerts`;

export function getAlertRules(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${alertBase(clusterId)}/rules`);
}

export function getAlertRule(clusterId: number, id: number) {
  return k8sRequestClient.get<any>(`${alertBase(clusterId)}/rules/${id}`);
}

export function createAlertRule(clusterId: number, rule: any) {
  return k8sRequestClient.post(`${alertBase(clusterId)}/rules`, rule);
}

export function updateAlertRule(clusterId: number, id: number, rule: any) {
  return k8sRequestClient.put(`${alertBase(clusterId)}/rules/${id}`, rule);
}

export function deleteAlertRule(clusterId: number, id: number) {
  return k8sRequestClient.delete(`${alertBase(clusterId)}/rules/${id}`);
}

export function toggleAlertRule(clusterId: number, id: number, enabled: boolean) {
  return k8sRequestClient.post(`${alertBase(clusterId)}/rules/${id}/toggle`, { enabled });
}

export function getAlertHistory(clusterId: number, limit = 100) {
  return k8sRequestClient.get<any[]>(`${alertBase(clusterId)}/history`, { params: { limit } });
}

export function getAlertHistoryByRule(clusterId: number, ruleId: number, limit = 50) {
  return k8sRequestClient.get<any[]>(`${alertBase(clusterId)}/rules/${ruleId}/history`, { params: { limit } });
}
