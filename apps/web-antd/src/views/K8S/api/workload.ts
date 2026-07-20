import { k8sRequestClient } from '#/api/request';

import type { K8sRevision, K8sWorkload } from './types';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/workloads`;

// ====== Deployments ======

export function getDeployments(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sWorkload[]>(
    `${base(clusterId, namespace)}/deployments`,
  );
}

export function getDeployment(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.get<K8sWorkload>(
    `${base(clusterId, namespace)}/deployments/${name}`,
  );
}

export function createDeployment(
  clusterId: number,
  namespace: string,
  yaml: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/deployments`,
    { yaml },
  );
}

export function updateDeployment(
  clusterId: number,
  namespace: string,
  name: string,
  yaml: string,
) {
  return k8sRequestClient.put(
    `${base(clusterId, namespace)}/deployments/${name}`,
    { yaml },
  );
}

export function deleteDeployment(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.delete(
    `${base(clusterId, namespace)}/deployments/${name}`,
  );
}

export function scaleDeployment(
  clusterId: number,
  namespace: string,
  name: string,
  replicas: number,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/deployments/${name}/scale`,
    { replicas },
  );
}

export function restartDeployment(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/deployments/${name}/restart`,
  );
}

export function getDeploymentRevisions(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.get<K8sRevision[]>(
    `${base(clusterId, namespace)}/deployments/${name}/revisions`,
  );
}

export function rollbackDeployment(
  clusterId: number,
  namespace: string,
  name: string,
  revision: number,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/deployments/${name}/rollback`,
    { revision },
  );
}

// ====== StatefulSets ======

export function getStatefulSets(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sWorkload[]>(
    `${base(clusterId, namespace)}/statefulsets`,
  );
}

export function getStatefulSet(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.get<K8sWorkload>(
    `${base(clusterId, namespace)}/statefulsets/${name}`,
  );
}

export function createStatefulSet(
  clusterId: number,
  namespace: string,
  yaml: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/statefulsets`,
    { yaml },
  );
}

export function updateStatefulSet(
  clusterId: number,
  namespace: string,
  name: string,
  yaml: string,
) {
  return k8sRequestClient.put(
    `${base(clusterId, namespace)}/statefulsets/${name}`,
    { yaml },
  );
}

export function deleteStatefulSet(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.delete(
    `${base(clusterId, namespace)}/statefulsets/${name}`,
  );
}

export function scaleStatefulSet(
  clusterId: number,
  namespace: string,
  name: string,
  replicas: number,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/statefulsets/${name}/scale`,
    { replicas },
  );
}

export function restartStatefulSet(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/statefulsets/${name}/restart`,
  );
}

// ====== DaemonSets ======

export function getDaemonSets(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sWorkload[]>(
    `${base(clusterId, namespace)}/daemonsets`,
  );
}

export function getDaemonSet(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.get<K8sWorkload>(
    `${base(clusterId, namespace)}/daemonsets/${name}`,
  );
}

export function createDaemonSet(
  clusterId: number,
  namespace: string,
  yaml: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/daemonsets`,
    { yaml },
  );
}

export function updateDaemonSet(
  clusterId: number,
  namespace: string,
  name: string,
  yaml: string,
) {
  return k8sRequestClient.put(
    `${base(clusterId, namespace)}/daemonsets/${name}`,
    { yaml },
  );
}

export function deleteDaemonSet(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.delete(
    `${base(clusterId, namespace)}/daemonsets/${name}`,
  );
}

export function restartDaemonSet(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/daemonsets/${name}/restart`,
  );
}
