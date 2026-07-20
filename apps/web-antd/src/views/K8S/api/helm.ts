import { k8sRequestClient } from '#/api/request';

// Use a fixed clusterId param in the URL since repos are global, but API requires clusterId
const helmBase = (cid: number) => `/clusters/${cid}/helm`;

// Repos
export function getHelmRepos(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${helmBase(clusterId)}/repos`);
}
export function getHelmRepo(clusterId: number, id: number) {
  return k8sRequestClient.get<any>(`${helmBase(clusterId)}/repos/${id}`);
}
export function addHelmRepo(clusterId: number, repo: any) {
  return k8sRequestClient.post(`${helmBase(clusterId)}/repos`, repo);
}
export function updateHelmRepo(clusterId: number, id: number, repo: any) {
  return k8sRequestClient.put(`${helmBase(clusterId)}/repos/${id}`, repo);
}
export function deleteHelmRepo(clusterId: number, id: number) {
  return k8sRequestClient.delete(`${helmBase(clusterId)}/repos/${id}`);
}
export function syncHelmRepo(clusterId: number, id: number) {
  return k8sRequestClient.post<any[]>(`${helmBase(clusterId)}/repos/${id}/sync`);
}

// Apps
export function searchHelmApps(clusterId: number, keyword?: string, repoId?: number) {
  const params: any = {};
  if (keyword) params.keyword = keyword;
  if (repoId) params.repoId = repoId;
  return k8sRequestClient.get<any[]>(`${helmBase(clusterId)}/apps`, { params });
}
export function getHelmAppDetail(clusterId: number, chartName: string, repoId: number) {
  return k8sRequestClient.get<any>(`${helmBase(clusterId)}/apps/${chartName}`, { params: { repoId } });
}
export function getHelmAppVersion(clusterId: number, chartName: string, version: string, repoId: number) {
  return k8sRequestClient.get<any>(`${helmBase(clusterId)}/apps/${chartName}/versions/${version}`, { params: { repoId } });
}

// Releases
export function getHelmReleases(clusterId: number) {
  return k8sRequestClient.get<any[]>(`${helmBase(clusterId)}/releases`);
}
export function getHelmRelease(clusterId: number, releaseName: string, namespace: string) {
  return k8sRequestClient.get<any>(`${helmBase(clusterId)}/releases/${releaseName}`, { params: { namespace } });
}
export function installHelmRelease(clusterId: number, data: {
  namespace: string; releaseName: string; chartName: string;
  chartVersion: string; repoId?: number; values?: string;
}) {
  return k8sRequestClient.post(`${helmBase(clusterId)}/releases`, data);
}
export function upgradeHelmRelease(clusterId: number, releaseName: string, data: {
  namespace: string; chartVersion: string; values?: string;
}) {
  return k8sRequestClient.put(`${helmBase(clusterId)}/releases/${releaseName}`, data);
}
export function uninstallHelmRelease(clusterId: number, releaseName: string, namespace: string) {
  return k8sRequestClient.delete(`${helmBase(clusterId)}/releases/${releaseName}`, { params: { namespace } });
}
export function rollbackHelmRelease(clusterId: number, releaseName: string, namespace: string, revision: number) {
  return k8sRequestClient.post(`${helmBase(clusterId)}/releases/${releaseName}/rollback`, { namespace, revision });
}
export function syncHelmReleases(clusterId: number) {
  return k8sRequestClient.post(`${helmBase(clusterId)}/releases/sync`);
}

// App Templates
const templateBase = '/app-templates';

export function getAppTemplates(category?: string) {
  const params: any = {};
  if (category) params.category = category;
  return k8sRequestClient.get<any[]>(templateBase, { params });
}
export function getAppCategories() {
  return k8sRequestClient.get<string[]>(`${templateBase}/categories`);
}
export function getAppFeatured() {
  return k8sRequestClient.get<any[]>(`${templateBase}/featured`);
}
export function getAppTemplate(id: number) {
  return k8sRequestClient.get<any>(`${templateBase}/${id}`);
}
export function installAppTemplate(id: number, data: {
  clusterId: number; namespace: string; releaseName: string; values?: string;
}) {
  return k8sRequestClient.post(`${templateBase}/${id}/install`, data);
}
