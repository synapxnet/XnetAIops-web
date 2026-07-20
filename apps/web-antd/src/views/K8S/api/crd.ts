import { k8sRequestClient } from '#/api/request';

const base = (cid: number) => `/clusters/${cid}/crds`;

export function getCrds(clusterId: number) {
  return k8sRequestClient.get<any[]>(base(clusterId));
}

export function getCrd(clusterId: number, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId)}/${name}`);
}

export function getCustomResources(clusterId: number, crdName: string, group: string, version: string, plural: string, namespace?: string) {
  const params = new URLSearchParams({ group, version, plural });
  if (namespace) params.set('namespace', namespace);
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/${crdName}/resources?${params.toString()}`);
}

export function getCustomResource(clusterId: number, crdName: string, resourceName: string, group: string, version: string, plural: string, namespace?: string) {
  const params = new URLSearchParams({ group, version, plural });
  if (namespace) params.set('namespace', namespace);
  return k8sRequestClient.get<any>(`${base(clusterId)}/${crdName}/resources/${resourceName}?${params.toString()}`);
}

export function deleteCustomResource(clusterId: number, crdName: string, resourceName: string, group: string, version: string, plural: string, namespace?: string) {
  const params = new URLSearchParams({ group, version, plural });
  if (namespace) params.set('namespace', namespace);
  return k8sRequestClient.delete(`${base(clusterId)}/${crdName}/resources/${resourceName}?${params.toString()}`);
}
