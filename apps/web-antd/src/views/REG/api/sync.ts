import { regRequestClient } from '#/api/request';

export interface SyncTask {
  id: number;
  registryId: number;
  sourceImage: string;
  targetProject: string;
  syncMethod: string;
  harborPolicyId: number | null;
  harborExecutionId: number | null;
  status: string;
  statusDetail: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Create a sync task (harbor_replication or skopeo) */
export function createSyncTask(
  registryId: number,
  data: { sourceImage: string; targetProject: string; syncMethod?: string },
) {
  return regRequestClient.post<SyncTask>(
    `/registries/${registryId}/sync`,
    data,
  );
}

/** List sync tasks for a registry */
export function getSyncTasks(registryId: number) {
  return regRequestClient.get<SyncTask[]>(
    `/registries/${registryId}/sync/tasks`,
  );
}

/** Get a single sync task */
export function getSyncTask(registryId: number, taskId: number) {
  return regRequestClient.get<SyncTask>(
    `/registries/${registryId}/sync/tasks/${taskId}`,
  );
}

/** Delete a sync task */
export function deleteSyncTask(registryId: number, taskId: number) {
  return regRequestClient.delete(
    `/registries/${registryId}/sync/tasks/${taskId}`,
  );
}

/** Retry a failed/cancelled sync task */
export function retrySyncTask(registryId: number, taskId: number) {
  return regRequestClient.post<SyncTask>(
    `/registries/${registryId}/sync/tasks/${taskId}/retry`,
  );
}

/** Refresh running task statuses */
export function refreshSyncTasks(registryId: number) {
  return regRequestClient.post(`/registries/${registryId}/sync/refresh`);
}

/** Batch sync: pull multiple images at once */
export function batchSyncImages(
  registryId: number,
  data: { images: string[]; targetProject: string; syncMethod?: string },
) {
  return regRequestClient.post<SyncTask[]>(
    `/registries/${registryId}/sync/batch`,
    data,
  );
}

/** Extract image references from K8s YAML */
export function extractImagesFromYaml(registryId: number, yaml: string) {
  return regRequestClient.post<string[]>(
    `/registries/${registryId}/sync/extract-images`,
    { yaml },
  );
}
