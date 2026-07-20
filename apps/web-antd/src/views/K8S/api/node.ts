import { k8sRequestClient } from '#/api/request';

import type { K8sNode } from './types';

/** 获取集群所有节点 */
export function getNodes(clusterId: number) {
  return k8sRequestClient.get<K8sNode[]>(
    `/clusters/${clusterId}/nodes`,
  );
}

/** 获取节点详情 */
export function getNode(clusterId: number, nodeName: string) {
  return k8sRequestClient.get<any>(
    `/clusters/${clusterId}/nodes/${nodeName}`,
  );
}

/** 获取节点上的Pod */
export function getNodePods(clusterId: number, nodeName: string) {
  return k8sRequestClient.get<any[]>(
    `/clusters/${clusterId}/nodes/${nodeName}/pods`,
  );
}

/** 标记节点不可调度 */
export function cordonNode(clusterId: number, nodeName: string) {
  return k8sRequestClient.post(
    `/clusters/${clusterId}/nodes/${nodeName}/cordon`,
  );
}

/** 取消不可调度 */
export function uncordonNode(clusterId: number, nodeName: string) {
  return k8sRequestClient.post(
    `/clusters/${clusterId}/nodes/${nodeName}/uncordon`,
  );
}

/** 驱逐节点 */
export function drainNode(clusterId: number, nodeName: string) {
  return k8sRequestClient.post(
    `/clusters/${clusterId}/nodes/${nodeName}/drain`,
  );
}

/** 更新标签 */
export function updateNodeLabels(
  clusterId: number,
  nodeName: string,
  labels: Record<string, string>,
) {
  return k8sRequestClient.put(
    `/clusters/${clusterId}/nodes/${nodeName}/labels`,
    labels,
  );
}

/** 更新污点 */
export function updateNodeTaints(
  clusterId: number,
  nodeName: string,
  taints: Array<{ effect: string; key: string; value: string }>,
) {
  return k8sRequestClient.put(
    `/clusters/${clusterId}/nodes/${nodeName}/taints`,
    taints,
  );
}

/** 获取节点指标 */
export function getNodeMetrics(clusterId: number, nodeName: string) {
  return k8sRequestClient.get<any>(
    `/clusters/${clusterId}/nodes/${nodeName}/metrics`,
  );
}
