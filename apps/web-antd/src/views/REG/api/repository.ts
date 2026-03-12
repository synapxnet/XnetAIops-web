import { regRequestClient } from '#/api/request';

export function getRepositories(registryId: number, projectName?: string) {
  const params = projectName ? { projectName } : {};
  return regRequestClient.get<any[]>(`/registries/${registryId}/repositories`, { params });
}

export function getTags(registryId: number, repoName: string) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/tags`, { params: { repoName } });
}

export function deleteTag(registryId: number, repoName: string, tag: string) {
  return regRequestClient.delete(`/registries/${registryId}/tags`, { params: { repoName, tag } });
}

export function getManifest(registryId: number, repoName: string, reference: string) {
  return regRequestClient.get<any>(`/registries/${registryId}/tags/manifest`, { params: { repoName, reference } });
}

export function getArtifacts(registryId: number, projectName: string, repoName: string) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/repositories/${projectName}/${repoName}/artifacts`);
}

export function getArtifactDetail(registryId: number, repoName: string, reference: string) {
  return regRequestClient.get<any>(`/registries/${registryId}/repositories/${repoName}/artifacts/${reference}`);
}

export function getUsers(registryId: number) {
  return regRequestClient.get<any[]>(`/registries/${registryId}/users`);
}

export function createUser(registryId: number, userInfo: Record<string, any>) {
  return regRequestClient.post(`/registries/${registryId}/users`, userInfo);
}

export function updateUser(registryId: number, userId: string, userInfo: Record<string, any>) {
  return regRequestClient.put(`/registries/${registryId}/users/${userId}`, userInfo);
}

export function deleteUser(registryId: number, userId: string) {
  return regRequestClient.delete(`/registries/${registryId}/users/${userId}`);
}
