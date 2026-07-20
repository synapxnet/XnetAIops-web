import type { Registry } from './types';

import { regRequestClient } from '#/api/request';

export function getRegistries() {
  return regRequestClient.get<Registry[]>('/registries');
}

export function getRegistry(id: number) {
  return regRequestClient.get<Registry>(`/registries/${id}`);
}

export function createRegistry(data: Partial<Registry>) {
  return regRequestClient.post<Registry>('/registries', data);
}

export function updateRegistry(id: number, data: Partial<Registry>) {
  return regRequestClient.put<Registry>(`/registries/${id}`, data);
}

export function deleteRegistry(id: number) {
  return regRequestClient.delete(`/registries/${id}`);
}

export function getRegistryStatus(id: number) {
  return regRequestClient.get<string>(`/registries/${id}/status`);
}

export function checkPort(params: {
  host: string;
  sshPort: number;
  sshUser: string;
  password: string;
  port: number;
}) {
  return regRequestClient.get<{
    occupied: boolean;
    detail: string;
    error?: string;
    port: number;
    host: string;
  }>('/registries/check-port', { params });
}
