import { k8sRequestClient } from '#/api/request';

const base = '/deploy';

export function getDeployPlans() {
  return k8sRequestClient.get<any[]>(`${base}/plans`);
}
export function getDeployPlan(id: number) {
  return k8sRequestClient.get<any>(`${base}/plans/${id}`);
}
export function createDeployPlan(data: any) {
  return k8sRequestClient.post<any>(`${base}/plans`, data);
}
export function deleteDeployPlan(id: number) {
  return k8sRequestClient.delete(`${base}/plans/${id}`);
}
export function validateDeployPlan(id: number) {
  return k8sRequestClient.post<any>(`${base}/plans/${id}/validate`);
}
export function executeDeployPlan(id: number) {
  return k8sRequestClient.post(`${base}/plans/${id}/execute`);
}
export function getDeployLogs(id: number) {
  return k8sRequestClient.get<any[]>(`${base}/plans/${id}/logs`);
}
export function addDeployNode(planId: number, node: any) {
  return k8sRequestClient.post(`${base}/plans/${planId}/add-node`, node);
}
export function removeDeployNode(planId: number, nodeId: number) {
  return k8sRequestClient.delete(`${base}/plans/${planId}/nodes/${nodeId}`);
}
export function getSupportedVersions() {
  return k8sRequestClient.get<string[]>(`${base}/supported-versions`);
}
export function getSupportedCni() {
  return k8sRequestClient.get<any[]>(`${base}/supported-cni`);
}
export function getSupportedCri() {
  return k8sRequestClient.get<any[]>(`${base}/supported-cri`);
}
export function getSupportedStorage() {
  return k8sRequestClient.get<any[]>(`${base}/supported-storage`);
}
