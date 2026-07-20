import type { NotifyGroup } from './types';

import { monRequestClient } from '#/api/request';

export function getNotifyGroups() {
  return monRequestClient.get<NotifyGroup[]>('/notify-groups');
}

export function createNotifyGroup(data: Partial<NotifyGroup>) {
  return monRequestClient.post<NotifyGroup>('/notify-groups', data);
}

export function updateNotifyGroup(id: number, data: Partial<NotifyGroup>) {
  return monRequestClient.put<NotifyGroup>(`/notify-groups/${id}`, data);
}

export function deleteNotifyGroup(id: number) {
  return monRequestClient.delete(`/notify-groups/${id}`);
}
