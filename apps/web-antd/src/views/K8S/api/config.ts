import { k8sRequestClient } from '#/api/request';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/configs`;

// ConfigMaps
export function getConfigMaps(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId, namespace)}/configmaps`);
}

export function getConfigMap(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId, namespace)}/configmaps/${name}`);
}

export function createConfigMap(clusterId: number, namespace: string, name: string, data: Record<string, string>) {
  return k8sRequestClient.post(`${base(clusterId, namespace)}/configmaps`, { name, data });
}

export function updateConfigMap(clusterId: number, namespace: string, name: string, data: Record<string, string>) {
  return k8sRequestClient.put(`${base(clusterId, namespace)}/configmaps/${name}`, { data });
}

export function deleteConfigMap(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId, namespace)}/configmaps/${name}`);
}

// Secrets
export function getSecrets(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId, namespace)}/secrets`);
}

export function getSecret(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId, namespace)}/secrets/${name}`);
}

export function createSecret(clusterId: number, namespace: string, name: string, type: string, data: Record<string, string>) {
  return k8sRequestClient.post(`${base(clusterId, namespace)}/secrets`, { name, type, data });
}

export function updateSecret(clusterId: number, namespace: string, name: string, data: Record<string, string>) {
  return k8sRequestClient.put(`${base(clusterId, namespace)}/secrets/${name}`, { data });
}

export function deleteSecret(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId, namespace)}/secrets/${name}`);
}
