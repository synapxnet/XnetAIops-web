import { k8sRequestClient } from '#/api/request';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/ingresses`;

export function getIngresses(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(base(clusterId, namespace));
}

export function getIngress(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId, namespace)}/${name}`);
}

export function createIngress(clusterId: number, namespace: string, yaml: string) {
  return k8sRequestClient.post(base(clusterId, namespace), { yaml });
}

export function updateIngress(clusterId: number, namespace: string, name: string, yaml: string) {
  return k8sRequestClient.put(`${base(clusterId, namespace)}/${name}`, { yaml });
}

export function deleteIngress(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId, namespace)}/${name}`);
}
