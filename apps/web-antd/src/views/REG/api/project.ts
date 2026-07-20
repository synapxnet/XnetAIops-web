import { regRequestClient } from '#/api/request';

export function getProjects(registryId: number) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/projects`);
}

export function createProject(registryId: number, projectName: string, isPublic: boolean) {
  return regRequestClient.post(`/registries/${registryId}/projects`, { projectName, isPublic });
}

export function deleteProject(registryId: number, projectId: string) {
  return regRequestClient.delete(`/registries/${registryId}/projects/${projectId}`);
}
