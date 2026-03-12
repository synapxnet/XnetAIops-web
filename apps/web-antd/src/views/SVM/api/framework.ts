import type { Framework, RoleDef, ServiceDef } from './types';

import { svmRequestClient } from '#/api/request';

export function getFrameworks() {
  return svmRequestClient.get<Framework[]>('/frameworks');
}

export function getFramework(id: number) {
  return svmRequestClient.get<Framework>(`/frameworks/${id}`);
}

export function createFramework(data: Partial<Framework>) {
  return svmRequestClient.post<Framework>('/frameworks', data);
}

export function updateFramework(id: number, data: Partial<Framework>) {
  return svmRequestClient.put<Framework>(`/frameworks/${id}`, data);
}

export function deleteFramework(id: number) {
  return svmRequestClient.delete(`/frameworks/${id}`);
}

export function getServiceDefs(frameworkId: number) {
  return svmRequestClient.get<ServiceDef[]>(
    `/frameworks/${frameworkId}/services`,
  );
}

export function createServiceDef(
  frameworkId: number,
  data: Partial<ServiceDef>,
) {
  return svmRequestClient.post<ServiceDef>(
    `/frameworks/${frameworkId}/services`,
    data,
  );
}

export function deleteServiceDef(serviceId: number) {
  return svmRequestClient.delete(`/frameworks/services/${serviceId}`);
}

export function getRoleDefs(frameworkId: number, serviceId: number) {
  return svmRequestClient.get<RoleDef[]>(
    `/frameworks/${frameworkId}/services/${serviceId}/roles`,
  );
}

export function updateServiceDef(serviceId: number, data: Partial<ServiceDef>) {
  return svmRequestClient.put<ServiceDef>(
    `/frameworks/services/${serviceId}`,
    data,
  );
}

export function createRoleDef(frameworkId: number, serviceId: number, data: Partial<RoleDef>) {
  return svmRequestClient.post<RoleDef>(
    `/frameworks/${frameworkId}/services/${serviceId}/roles`,
    data,
  );
}

export function updateRoleDef(roleId: number, data: Partial<RoleDef>) {
  return svmRequestClient.put<RoleDef>(`/frameworks/roles/${roleId}`, data);
}

export function deleteRoleDef(roleId: number) {
  return svmRequestClient.delete(`/frameworks/roles/${roleId}`);
}
