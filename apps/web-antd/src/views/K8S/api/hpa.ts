import { k8sRequestClient } from '#/api/request';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/hpa`;

export function getHpas(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(base(clusterId, namespace));
}

export function getHpa(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId, namespace)}/${name}`);
}

export function createHpa(clusterId: number, namespace: string, yaml: string) {
  return k8sRequestClient.post(base(clusterId, namespace), { yaml });
}

export function updateHpa(clusterId: number, namespace: string, name: string, yaml: string) {
  return k8sRequestClient.put(`${base(clusterId, namespace)}/${name}`, { yaml });
}

export function deleteHpa(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId, namespace)}/${name}`);
}
