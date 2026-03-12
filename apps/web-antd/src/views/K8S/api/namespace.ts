import { k8sRequestClient } from '#/api/request';

import type {
  K8sEvent,
  K8sNamespace,
  K8sNamespaceOverview,
  K8sResourceQuota,
} from './types';

/** 获取命名空间列表 */
export function getNamespaces(clusterId: number) {
  return k8sRequestClient.get<K8sNamespace[]>(
    `/clusters/${clusterId}/namespaces`,
  );
}

/** 获取命名空间详情 */
export function getNamespace(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sNamespace>(
    `/clusters/${clusterId}/namespaces/${namespace}`,
  );
}

/** 创建命名空间 */
export function createNamespace(
  clusterId: number,
  data: { labels?: Record<string, string>; name: string },
) {
  return k8sRequestClient.post(
    `/clusters/${clusterId}/namespaces`,
    data,
  );
}

/** 删除命名空间 */
export function deleteNamespace(clusterId: number, namespace: string) {
  return k8sRequestClient.delete(
    `/clusters/${clusterId}/namespaces/${namespace}`,
  );
}

/** 获取命名空间概览 */
export function getNamespaceOverview(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sNamespaceOverview>(
    `/clusters/${clusterId}/namespaces/${namespace}/overview`,
  );
}

/** 获取命名空间事件 */
export function getNamespaceEvents(
  clusterId: number,
  namespace: string,
  limit = 50,
) {
  return k8sRequestClient.get<K8sEvent[]>(
    `/clusters/${clusterId}/namespaces/${namespace}/events`,
    { params: { limit } },
  );
}

/** 获取资源配额 */
export function getResourceQuotas(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sResourceQuota[]>(
    `/clusters/${clusterId}/namespaces/${namespace}/resource-quotas`,
  );
}

/** 设置资源配额 */
export function setResourceQuota(
  clusterId: number,
  namespace: string,
  hard: Record<string, string>,
) {
  return k8sRequestClient.post(
    `/clusters/${clusterId}/namespaces/${namespace}/resource-quotas`,
    hard,
  );
}
