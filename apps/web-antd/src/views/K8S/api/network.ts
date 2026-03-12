import { k8sRequestClient } from '#/api/request';

const base = (cid: number, ns: string) =>
  `/clusters/${cid}/namespaces/${ns}/networkpolicies`;

export function getNetworkPolicies(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(base(clusterId, namespace));
}

export function getNetworkPolicy(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId, namespace)}/${name}`);
}

export function createNetworkPolicy(clusterId: number, namespace: string, yaml: string) {
  return k8sRequestClient.post(base(clusterId, namespace), { yaml });
}

export function deleteNetworkPolicy(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId, namespace)}/${name}`);
}
