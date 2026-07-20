import type { RoleInstance, ServiceInstance } from './types';

import { svmRequestClient } from '#/api/request';

export function getServiceInstances(clusterId?: number) {
  const params = clusterId ? { clusterId } : {};
  return svmRequestClient.get<ServiceInstance[]>('/services', { params });
}

export function getServiceInstance(id: number) {
  return svmRequestClient.get<ServiceInstance>(`/services/${id}`);
}

export function createServiceInstance(data: Partial<ServiceInstance>) {
  return svmRequestClient.post<ServiceInstance>('/services', data);
}

export function updateServiceInstance(
  id: number,
  data: Partial<ServiceInstance>,
) {
  return svmRequestClient.put<ServiceInstance>(`/services/${id}`, data);
}

export function deleteServiceInstance(id: number) {
  return svmRequestClient.delete(`/services/${id}`);
}

export function getRoleInstances(serviceInstanceId: number) {
  return svmRequestClient.get<RoleInstance[]>(
    `/services/${serviceInstanceId}/roles`,
  );
}

export function addRoleInstance(
  serviceInstanceId: number,
  data: Partial<RoleInstance>,
) {
  return svmRequestClient.post<RoleInstance>(
    `/services/${serviceInstanceId}/roles`,
    data,
  );
}

export function removeRoleInstance(roleId: number) {
  return svmRequestClient.delete(`/services/roles/${roleId}`);
}

// --- Service lifecycle operations ---

export function installService(id: number) {
  return svmRequestClient.post(`/services/${id}/install`);
}

export function startService(id: number) {
  return svmRequestClient.post(`/services/${id}/start`);
}

export function stopService(id: number) {
  return svmRequestClient.post(`/services/${id}/stop`);
}

export function restartService(id: number) {
  return svmRequestClient.post(`/services/${id}/restart`);
}

export function pushConfig(id: number) {
  return svmRequestClient.post(`/services/${id}/config`);
}

export function getServiceDetail(id: number) {
  return svmRequestClient.get<Record<string, any>>(`/services/${id}/detail`);
}
