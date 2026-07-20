import { k8sRequestClient } from '#/api/request';

const storageBase = (cid: number) => `/clusters/${cid}/storage`;

// StorageClass
export function getStorageClasses(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${storageBase(clusterId)}/storageclasses`);
}

export function getStorageClass(clusterId: number, name: string) {
  return k8sRequestClient.get<any>(`${storageBase(clusterId)}/storageclasses/${name}`);
}

// PVC
export function getPVCs(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(`${storageBase(clusterId)}/namespaces/${namespace}/pvcs`);
}

export function getPVC(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${storageBase(clusterId)}/namespaces/${namespace}/pvcs/${name}`);
}

export function createPVC(clusterId: number, namespace: string, yaml: string) {
  return k8sRequestClient.post(`${storageBase(clusterId)}/namespaces/${namespace}/pvcs`, { yaml });
}

export function deletePVC(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${storageBase(clusterId)}/namespaces/${namespace}/pvcs/${name}`);
}

// PV
export function getPVs(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${storageBase(clusterId)}/pvs`);
}

export function getPV(clusterId: number, name: string) {
  return k8sRequestClient.get<any>(`${storageBase(clusterId)}/pvs/${name}`);
}

export function deletePV(clusterId: number, name: string) {
  return k8sRequestClient.delete(`${storageBase(clusterId)}/pvs/${name}`);
}
