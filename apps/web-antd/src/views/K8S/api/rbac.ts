import { k8sRequestClient } from '#/api/request';

const base = (cid: number) => `/clusters/${cid}/rbac`;

// ClusterRoles
export function getClusterRoles(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/clusterroles`);
}
export function getClusterRole(clusterId: number, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId)}/clusterroles/${name}`);
}
export function deleteClusterRole(clusterId: number, name: string) {
  return k8sRequestClient.delete(`${base(clusterId)}/clusterroles/${name}`);
}

// ClusterRoleBindings
export function getClusterRoleBindings(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/clusterrolebindings`);
}
export function deleteClusterRoleBinding(clusterId: number, name: string) {
  return k8sRequestClient.delete(`${base(clusterId)}/clusterrolebindings/${name}`);
}

// Roles
export function getRoles(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/namespaces/${namespace}/roles`);
}
export function deleteRole(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId)}/namespaces/${namespace}/roles/${name}`);
}

// RoleBindings
export function getRoleBindings(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/namespaces/${namespace}/rolebindings`);
}
export function deleteRoleBinding(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId)}/namespaces/${namespace}/rolebindings/${name}`);
}

// ServiceAccounts
export function getServiceAccounts(clusterId: number, namespace: string) {
  return k8sRequestClient.get<any[]>(`${base(clusterId)}/namespaces/${namespace}/serviceaccounts`);
}
export function getServiceAccount(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.get<any>(`${base(clusterId)}/namespaces/${namespace}/serviceaccounts/${name}`);
}
export function deleteServiceAccount(clusterId: number, namespace: string, name: string) {
  return k8sRequestClient.delete(`${base(clusterId)}/namespaces/${namespace}/serviceaccounts/${name}`);
}
