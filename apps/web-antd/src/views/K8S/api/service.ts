import { k8sRequestClient } from '#/api/request';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/services`;

export function getServices(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(base(clusterId, namespace));
}

export function getService(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId, namespace)}/${name}`);
}

export function createService(clusterId: number, namespace: string, yaml: string) {
  return k8sRequestClient.post(base(clusterId, namespace), { yaml });
}

export function updateService(clusterId: number, namespace: string, name: string, yaml: string) {
  return k8sRequestClient.put(`${base(clusterId, namespace)}/${name}`, { yaml });
}

export function deleteService(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId, namespace)}/${name}`);
}

export function getServiceEndpoints(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId, namespace)}/${name}/endpoints`);
}
