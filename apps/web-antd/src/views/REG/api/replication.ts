import type { QuickSyncRequest } from './types';

import { regRequestClient } from '#/api/request';

// ==================== External Registry Endpoints ====================

export function getEndpoints(registryId: number) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/endpoints`);
}

export function createEndpoint(registryId: number, data: Record<string, any>) {
  return regRequestClient.post(`/registries/${registryId}/endpoints`, data);
}

export function updateEndpoint(registryId: number, endpointId: number, data: Record<string, any>) {
  return regRequestClient.put(`/registries/${registryId}/endpoints/${endpointId}`, data);
}

export function deleteEndpoint(registryId: number, endpointId: number) {
  return regRequestClient.delete(`/registries/${registryId}/endpoints/${endpointId}`);
}

export function pingEndpoint(registryId: number, data: Record<string, any>) {
  return regRequestClient.post<any>(`/registries/${registryId}/endpoints/ping`, data);
}

// ==================== Replication Policies ====================

export function getReplicationPolicies(registryId: number) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/replications/policies`);
}

export function createReplicationPolicy(registryId: number, data: Record<string, any>) {
  return regRequestClient.post(`/registries/${registryId}/replications/policies`, data);
}

export function getReplicationPolicy(registryId: number, policyId: number) {
  return regRequestClient.get<any>(`/registries/${registryId}/replications/policies/${policyId}`);
}

export function updateReplicationPolicy(registryId: number, policyId: number, data: Record<string, any>) {
  return regRequestClient.put(`/registries/${registryId}/replications/policies/${policyId}`, data);
}

export function deleteReplicationPolicy(registryId: number, policyId: number) {
  return regRequestClient.delete(`/registries/${registryId}/replications/policies/${policyId}`);
}

// ==================== Replication Executions ====================

export function triggerReplication(registryId: number, data: Record<string, any>) {
  return regRequestClient.post(`/registries/${registryId}/replications/executions`, data);
}

export function getReplicationExecutions(registryId: number, policyId?: number) {
  const params = policyId ? { policyId } : {};
  return regRequestClient.get<any[]>(`/registries/${registryId}/replications/executions`, { params });
}

export function getReplicationTasks(registryId: number, executionId: number) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/replications/executions/${executionId}/tasks`);
}

// ==================== Quick Sync ====================

export function quickSync(registryId: number, data: QuickSyncRequest) {
  return regRequestClient.post<any>(`/registries/${registryId}/replications/quick-sync`, data);
}
