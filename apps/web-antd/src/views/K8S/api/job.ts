import { k8sRequestClient } from '#/api/request';

import type { K8sCronJob, K8sJob } from './types';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/jobs`;

// ====== Jobs ======

export function getJobs(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sJob[]>(base(clusterId, namespace));
}

export function getJob(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<K8sJob>(
    `${base(clusterId, namespace)}/${name}`,
  );
}

export function createJob(
  clusterId: number,
  namespace: string,
  yaml: string,
) {
  return k8sRequestClient.post(base(clusterId, namespace), { yaml });
}

export function deleteJob(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.delete(
    `${base(clusterId, namespace)}/${name}`,
  );
}

export function rerunJob(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/${name}/rerun`,
  );
}

// ====== CronJobs ======

export function getCronJobs(clusterId: number, namespace: string) {
  return k8sRequestClient.get<K8sCronJob[]>(
    `${base(clusterId, namespace)}/cronjobs`,
  );
}

export function getCronJob(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.get<K8sCronJob>(
    `${base(clusterId, namespace)}/cronjobs/${name}`,
  );
}

export function createCronJob(
  clusterId: number,
  namespace: string,
  yaml: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/cronjobs`,
    { yaml },
  );
}

export function updateCronJob(
  clusterId: number,
  namespace: string,
  name: string,
  yaml: string,
) {
  return k8sRequestClient.put(
    `${base(clusterId, namespace)}/cronjobs/${name}`,
    { yaml },
  );
}

export function deleteCronJob(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.delete(
    `${base(clusterId, namespace)}/cronjobs/${name}`,
  );
}

export function triggerCronJob(
  clusterId: number,
  namespace: string,
  name: string,
) {
  return k8sRequestClient.post(
    `${base(clusterId, namespace)}/cronjobs/${name}/trigger`,
  );
}
