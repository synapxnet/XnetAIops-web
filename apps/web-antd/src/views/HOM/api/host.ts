import type { Host, Rack, SshTestResult } from './types';

import { homRequestClient } from '#/api/request';

// 获取主机列表
export function getHosts(clusterId?: number) {
  const params = clusterId ? { clusterId } : {};
  return homRequestClient.get<Host[]>('/hosts', { params });
}

// 获取单个主机
export function getHost(id: number) {
  return homRequestClient.get<Host>(`/hosts/${id}`);
}

// 创建主机
export function createHost(data: Partial<Host>) {
  return homRequestClient.post<Host>('/hosts', data);
}

// 更新主机
export function updateHost(id: number, data: Partial<Host>) {
  return homRequestClient.put<Host>(`/hosts/${id}`, data);
}

// 删除主机
export function deleteHost(id: number) {
  return homRequestClient.delete(`/hosts/${id}`);
}

// SSH连接测试
export function testSshConnection(data: {
  host: string;
  port: number;
  user: string;
  password: string;
}) {
  return homRequestClient.post<SshTestResult>('/hosts/test-connection', data);
}

// 获取机架列表
export function getRacks(clusterId: number) {
  return homRequestClient.get<Rack[]>('/racks', { params: { clusterId } });
}

// 创建机架
export function createRack(data: Partial<Rack>) {
  return homRequestClient.post<Rack>('/racks', data);
}

// 删除机架
export function deleteRack(id: number) {
  return homRequestClient.delete(`/racks/${id}`);
}
