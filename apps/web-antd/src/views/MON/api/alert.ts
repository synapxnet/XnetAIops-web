import type { AlertHistory, AlertRule, AlertSummary } from './types';

import { monRequestClient } from '#/api/request';

// --- Alert Rules ---

export function getAlertRules(clusterId?: number) {
  const params = clusterId ? { clusterId } : {};
  return monRequestClient.get<AlertRule[]>('/rules', { params });
}

export function getAlertRule(id: number) {
  return monRequestClient.get<AlertRule>(`/rules/${id}`);
}

export function createAlertRule(data: Partial<AlertRule>) {
  return monRequestClient.post<AlertRule>('/rules', data);
}

export function updateAlertRule(id: number, data: Partial<AlertRule>) {
  return monRequestClient.put<AlertRule>(`/rules/${id}`, data);
}

export function deleteAlertRule(id: number) {
  return monRequestClient.delete(`/rules/${id}`);
}

export function toggleAlertRule(id: number) {
  return monRequestClient.put<AlertRule>(`/rules/${id}/toggle`);
}

// --- Alert History ---

export function getAlertHistory(clusterId?: number, status?: string) {
  const params: Record<string, any> = {};
  if (clusterId) params.clusterId = clusterId;
  if (status) params.status = status;
  return monRequestClient.get<AlertHistory[]>('/alerts', { params });
}

export function getAlertDetail(id: number) {
  return monRequestClient.get<AlertHistory>(`/alerts/${id}`);
}

export function acknowledgeAlert(id: number) {
  return monRequestClient.put<AlertHistory>(`/alerts/${id}/acknowledge`);
}

export function resolveAlert(id: number) {
  return monRequestClient.put<AlertHistory>(`/alerts/${id}/resolve`);
}

export function getAlertSummary() {
  return monRequestClient.get<AlertSummary>('/alerts/summary');
}
