import {
  agentK8sRequestClient,
  agentMonRequestClient,
  agentSvmRequestClient,
} from '#/api/request';

import type { IncidentContext, ToolResponse } from './types';

export interface AlertEvidence {
  advice?: string;
  alertName: string;
  alertUid: string;
  clusterId?: string;
  description?: string;
  hostname?: string;
  level: string;
  relatedResource?: {
    name: string;
    namespace: string;
    type: string;
    uid: string;
  };
  resolvedAt?: string;
  status: string;
  triggeredAt: string;
}

export interface PodEvidence {
  name: string;
  phase: string;
  ready: boolean;
  restartCount: number;
  startedAt?: string;
}

export interface EventEvidence {
  count: number;
  lastAt?: string;
  message?: string;
  reason?: string;
  type?: string;
}

export interface WorkloadEvidence {
  availableReplicas: number;
  collectedAt: string;
  currentRevision?: string;
  desiredReplicas: number;
  events: EventEvidence[];
  imageRefs: string[];
  kind: string;
  metrics: {
    cpu?: number;
    errorRate?: number;
    memory?: number;
    p95Ms?: number;
    requestRate?: number;
    windowMinutes: number;
  };
  name: string;
  namespace: string;
  pods: PodEvidence[];
  readyReplicas: number;
  resourceVersion?: string;
  warnings: string[];
}

export interface ServiceHealthEvidence {
  conclusion: 'DEGRADED' | 'HEALTHY' | 'UNKNOWN' | 'UNHEALTHY';
  configVersion?: number;
  failedRoleCount: number;
  needRestart: boolean;
  reasonCodes: string[];
  roleCount: number;
  serviceName: string;
  serviceUid: string;
  status: string;
}

interface ToolRequest<T> {
  arguments: T;
  requestId: string;
  toolName: string;
}

/** 为一次工具调用创建完整 Trace Header。 */
function headers(context: IncidentContext, toolName: string) {
  return {
    'Idempotency-Key': crypto.randomUUID(),
    'X-OpenXnet-Incident-Id': context.incidentId,
    'X-OpenXnet-Tool-Name': toolName,
    'X-OpenXnet-Trace-Id': context.traceId,
    'X-OpenXnet-Workspace-Id': context.workspaceId,
  };
}

/** 创建只读工具请求包络。 */
function request<T>(toolName: string, argumentsValue: T): ToolRequest<T> {
  return { arguments: argumentsValue, requestId: `req_${crypto.randomUUID()}`, toolName };
}

/** 获取当前事件关联的告警证据。 */
export async function getAlertEvidence(
  alertUid: string,
  context: IncidentContext,
): Promise<ToolResponse<AlertEvidence>> {
  const toolName = 'aiops.alert.get';
  return agentMonRequestClient.post('/api/agent/v1/tools/aiops.alert.get:invoke',
    request(toolName, { alertUid }), { headers: headers(context, toolName) });
}

/** 获取 Kubernetes Workload、Pod、Event 和指标证据。 */
export async function getWorkloadEvidence(
  argumentsValue: { clusterId: string; kind: string; name: string; namespace: string; windowMinutes: number },
  context: IncidentContext,
): Promise<ToolResponse<WorkloadEvidence>> {
  const toolName = 'aiops.k8s.workload.get';
  return agentK8sRequestClient.post('/api/agent/v1/tools/aiops.k8s.workload.get:invoke',
    request(toolName, argumentsValue), { headers: headers(context, toolName) });
}

/** 获取服务实例状态和后端健康结论。 */
export async function getServiceHealthEvidence(
  serviceUid: string,
  context: IncidentContext,
): Promise<ToolResponse<ServiceHealthEvidence>> {
  const toolName = 'aiops.service.health';
  return agentSvmRequestClient.post('/api/agent/v1/tools/aiops.service.health:invoke',
    request(toolName, { serviceUid, windowMinutes: 15 }), { headers: headers(context, toolName) });
}
