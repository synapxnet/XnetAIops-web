import { k8sRequestClient } from '#/api/request';

import type { K8sContainerDetail, K8sEvent, K8sPod } from './types';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/pods`;

/** 获取Pod列表 */
export function getPods(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sPod[]>(base(clusterId, namespace));
}

/** 获取Pod详情 */
export function getPod(clusterId: number, namespace: string, podName: string) {
  return k8sRequestClient.get<K8sPod>(
    `${base(clusterId, namespace)}/${podName}`,
  );
}

/** 删除Pod */
export function deletePod(
  clusterId: number,
  namespace: string,
  podName: string,
) {
  return k8sRequestClient.delete(
    `${base(clusterId, namespace)}/${podName}`,
  );
}

/** 获取Pod日志 */
export function getPodLogs(
  clusterId: number,
  namespace: string,
  podName: string,
  container?: string,
  tailLines = 1000,
) {
  return k8sRequestClient.get<string>(
    `${base(clusterId, namespace)}/${podName}/logs`,
    { params: { container, tailLines } },
  );
}

/** 获取Pod事件 */
export function getPodEvents(
  clusterId: number,
  namespace: string,
  podName: string,
) {
  return k8sRequestClient.get<K8sEvent[]>(
    `${base(clusterId, namespace)}/${podName}/events`,
  );
}

/** 获取Pod容器列表 */
export function getPodContainers(
  clusterId: number,
  namespace: string,
  podName: string,
) {
  return k8sRequestClient.get<K8sContainerDetail[]>(
    `${base(clusterId, namespace)}/${podName}/containers`,
  );
}
