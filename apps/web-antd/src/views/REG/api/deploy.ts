import type { DeployLog } from './types';

import { regRequestClient } from '#/api/request';

export function deployRegistry(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy`);
}

export function undeployRegistry(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy/undeploy`);
}

export function startRegistry(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy/start`);
}

export function stopRegistry(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy/stop`);
}

export function restartRegistry(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy/restart`);
}

export function upgradeRegistry(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy/upgrade`);
}

export function cancelDeploy(id: number) {
  return regRequestClient.post(`/registries/${id}/deploy/cancel`);
}

export function getDeployLogs(id: number) {
  return regRequestClient.get<DeployLog[]>(`/registries/${id}/deploy/logs`);
}
