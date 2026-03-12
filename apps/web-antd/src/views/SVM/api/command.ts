import type { Command } from './types';

import { svmRequestClient } from '#/api/request';

export function getCommands(clusterId?: number) {
  const params = clusterId ? { clusterId } : {};
  return svmRequestClient.get<Command[]>('/commands', { params });
}

export function getCommandDetail(id: number) {
  return svmRequestClient.get<Record<string, any>>(`/commands/${id}`);
}

export function createCommand(data: Partial<Command>) {
  return svmRequestClient.post<Command>('/commands', data);
}

export function updateCommandStatus(
  id: number,
  status: string,
  progress?: number,
) {
  return svmRequestClient.put<Command>(`/commands/${id}/status`, {
    status,
    progress,
  });
}

export function cancelCommand(id: number) {
  return svmRequestClient.post(`/commands/${id}/cancel`);
}
