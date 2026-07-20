import type { Cluster, ClusterOverview, ClusterVariable } from './types';

import { clmRequestClient } from '#/api/request';

// 获取集群列表
export function getClusters() {
  return clmRequestClient.get<Cluster[]>('/clusters');
}

// 获取单个集群
export function getCluster(id: number) {
  return clmRequestClient.get<Cluster>(`/clusters/${id}`);
}

// 创建集群
export function createCluster(data: Partial<Cluster>) {
  return clmRequestClient.post<Cluster>('/clusters', data);
}

// 更新集群
export function updateCluster(id: number, data: Partial<Cluster>) {
  return clmRequestClient.put<Cluster>(`/clusters/${id}`, data);
}

// 删除集群
export function deleteCluster(id: number) {
  return clmRequestClient.delete(`/clusters/${id}`);
}

// 集群概览
export function getClusterOverview(id: number) {
  return clmRequestClient.get<ClusterOverview>(`/clusters/${id}/overview`);
}

// 获取集群变量
export function getClusterVariables(id: number) {
  return clmRequestClient.get<ClusterVariable[]>(`/clusters/${id}/variables`);
}

// 保存集群变量
export function saveClusterVariable(
  clusterId: number,
  data: Partial<ClusterVariable>,
) {
  return clmRequestClient.post(`/clusters/${clusterId}/variables`, data);
}

// 删除集群变量
export function deleteClusterVariable(variableId: number) {
  return clmRequestClient.delete(`/clusters/variables/${variableId}`);
}
