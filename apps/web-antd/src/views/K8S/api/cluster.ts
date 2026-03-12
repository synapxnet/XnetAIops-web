import { k8sRequestClient } from '#/api/request';

import type {
  K8sCluster,
  K8sClusterComponent,
  K8sClusterMetrics,
  K8sClusterOverview,
  K8sEvent,
  K8sNodeRanking,
} from './types';

/** 获取所有K8s集群 */
export function getClusters() {
  return k8sRequestClient.get<K8sCluster[]>('/clusters');
}

/** 获取集群详情 */
export function getCluster(id: number) {
  return k8sRequestClient.get<K8sCluster>(`/clusters/${id}`);
}

/** 创建集群 */
export function createCluster(data: {
  description?: string;
  kubeconfig: string;
  name: string;
  provider?: string;
  sshHost?: string;
  sshKey?: string;
  sshPassword?: string;
  sshPort?: number;
  sshUser?: string;
}) {
  return k8sRequestClient.post<K8sCluster>('/clusters', data);
}

/** 更新集群 */
export function updateCluster(
  id: number,
  data: {
    description?: string;
    kubeconfig?: string;
    name: string;
    provider?: string;
    sshHost?: string;
    sshKey?: string;
    sshPassword?: string;
    sshPort?: number;
    sshUser?: string;
  },
) {
  return k8sRequestClient.put<K8sCluster>(`/clusters/${id}`, data);
}

/** 更新集群SSH配置 */
export function updateClusterSsh(
  id: number,
  data: {
    sshHost?: string;
    sshKey?: string;
    sshPassword?: string;
    sshPort?: number;
    sshUser?: string;
  },
) {
  return k8sRequestClient.put(`/clusters/${id}/ssh`, data);
}

/** 删除集群 */
export function deleteCluster(id: number) {
  return k8sRequestClient.delete(`/clusters/${id}`);
}

/** 测试集群连接 */
export function testClusterConnection(kubeconfig: string) {
  return k8sRequestClient.post<{
    apiServerUrl?: string;
    connected: boolean;
    error?: string;
    nodeCount?: number;
    platform?: string;
    version?: string;
  }>('/clusters/test-connection', { kubeconfig });
}

/** 获取集群总览 */
export function getClusterOverview(id: number) {
  return k8sRequestClient.get<K8sClusterOverview>(`/clusters/${id}/overview`);
}

/** 获取集群组件 */
export function getClusterComponents(id: number) {
  return k8sRequestClient.get<K8sClusterComponent[]>(
    `/clusters/${id}/components`,
  );
}

/** 获取集群指标 */
export function getClusterMetrics(id: number) {
  return k8sRequestClient.get<K8sClusterMetrics>(`/clusters/${id}/metrics`);
}

/** 获取集群事件 */
export function getClusterEvents(id: number, limit = 50) {
  return k8sRequestClient.get<K8sEvent[]>(`/clusters/${id}/events`, {
    params: { limit },
  });
}

/** 获取kubeconfig */
export function getClusterKubeconfig(id: number) {
  return k8sRequestClient.get<string>(`/clusters/${id}/kubeconfig`);
}

/** 获取节点使用排名 */
export function getNodeRanking(id: number, sortBy = 'cpu', limit = 5) {
  return k8sRequestClient.get<K8sNodeRanking[]>(
    `/clusters/${id}/node-ranking`,
    {
      params: { limit, sortBy },
    },
  );
}
