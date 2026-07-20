import { k8sRequestClient } from '#/api/request';

// ====== DevOps 工程 ======

/** 获取所有DevOps工程 */
export function getDevopsProjects() {
  return k8sRequestClient.get<any[]>('/devops/projects');
}

/** 获取工程详情 */
export function getDevopsProject(id: number) {
  return k8sRequestClient.get<any>(`/devops/projects/${id}`);
}

/** 创建工程 */
export function createDevopsProject(data: any) {
  return k8sRequestClient.post<any>('/devops/projects', data);
}

/** 更新工程 */
export function updateDevopsProject(id: number, data: any) {
  return k8sRequestClient.put<any>(`/devops/projects/${id}`, data);
}

/** 删除工程 */
export function deleteDevopsProject(id: number) {
  return k8sRequestClient.delete(`/devops/projects/${id}`);
}

/** 测试Jenkins连接 */
export function testJenkinsConnection(id: number) {
  return k8sRequestClient.post<any>(`/devops/projects/${id}/test-connection`);
}

// ====== 流水线 ======

/** 获取流水线列表 */
export function getPipelines(projectId: number) {
  return k8sRequestClient.get<any[]>(
    `/devops/projects/${projectId}/pipelines`,
  );
}

/** 获取流水线详情 */
export function getPipeline(projectId: number, id: number) {
  return k8sRequestClient.get<any>(
    `/devops/projects/${projectId}/pipelines/${id}`,
  );
}

/** 创建流水线 */
export function createPipeline(projectId: number, data: any) {
  return k8sRequestClient.post<any>(
    `/devops/projects/${projectId}/pipelines`,
    data,
  );
}

/** 更新流水线 */
export function updatePipeline(projectId: number, id: number, data: any) {
  return k8sRequestClient.put<any>(
    `/devops/projects/${projectId}/pipelines/${id}`,
    data,
  );
}

/** 删除流水线 */
export function deletePipeline(projectId: number, id: number) {
  return k8sRequestClient.delete(
    `/devops/projects/${projectId}/pipelines/${id}`,
  );
}

/** 获取Jenkinsfile */
export function getJenkinsfile(projectId: number, id: number) {
  return k8sRequestClient.get<string>(
    `/devops/projects/${projectId}/pipelines/${id}/jenkinsfile`,
  );
}

/** 更新Jenkinsfile */
export function updateJenkinsfile(
  projectId: number,
  id: number,
  jenkinsfile: string,
) {
  return k8sRequestClient.put(
    `/devops/projects/${projectId}/pipelines/${id}/jenkinsfile`,
    { jenkinsfile },
  );
}

// ====== 流水线运行 ======

/** 触发运行 */
export function triggerPipelineRun(
  projectId: number,
  pipelineId: number,
  params?: Record<string, string>,
) {
  return k8sRequestClient.post<any>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs`,
    { parameters: params },
  );
}

/** 获取运行列表 */
export function getPipelineRuns(projectId: number, pipelineId: number) {
  return k8sRequestClient.get<any[]>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs`,
  );
}

/** 获取运行详情 */
export function getPipelineRun(
  projectId: number,
  pipelineId: number,
  runId: number,
) {
  return k8sRequestClient.get<any>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}`,
  );
}

/** 获取阶段状态 */
export function getPipelineRunStages(
  projectId: number,
  pipelineId: number,
  runId: number,
) {
  return k8sRequestClient.get<any[]>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}/stages`,
  );
}

/** 获取构建日志 */
export function getPipelineRunLog(
  projectId: number,
  pipelineId: number,
  runId: number,
) {
  return k8sRequestClient.get<string>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}/log`,
  );
}

/** 获取阶段日志 */
export function getStageLog(
  projectId: number,
  pipelineId: number,
  runId: number,
  nodeId: string,
) {
  return k8sRequestClient.get<string>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}/stages/${nodeId}/log`,
  );
}

/** 停止运行 */
export function stopPipelineRun(
  projectId: number,
  pipelineId: number,
  runId: number,
) {
  return k8sRequestClient.post(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}/stop`,
  );
}

/** 重放运行 */
export function replayPipelineRun(
  projectId: number,
  pipelineId: number,
  runId: number,
) {
  return k8sRequestClient.post<any>(
    `/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}/replay`,
  );
}

// ====== 凭证 ======

/** 获取凭证列表 */
export function getCredentials(projectId: number) {
  return k8sRequestClient.get<any[]>(
    `/devops/projects/${projectId}/credentials`,
  );
}

/** 获取凭证详情 */
export function getCredential(projectId: number, id: number) {
  return k8sRequestClient.get<any>(
    `/devops/projects/${projectId}/credentials/${id}`,
  );
}

/** 创建凭证 */
export function createCredential(projectId: number, data: any) {
  return k8sRequestClient.post<any>(
    `/devops/projects/${projectId}/credentials`,
    data,
  );
}

/** 更新凭证 */
export function updateCredential(projectId: number, id: number, data: any) {
  return k8sRequestClient.put<any>(
    `/devops/projects/${projectId}/credentials/${id}`,
    data,
  );
}

/** 删除凭证 */
export function deleteCredential(projectId: number, id: number) {
  return k8sRequestClient.delete(
    `/devops/projects/${projectId}/credentials/${id}`,
  );
}
