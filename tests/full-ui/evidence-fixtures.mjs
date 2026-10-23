/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

/** 为原生证据页面提供显式命名的本地显示样本。Provide explicitly named local display samples for native evidence pages. */
export function evidenceFixture(url, mode) {
  const match =
    /^\/api\/(mon|svm|k8s)\/operations-workspace(\/evidence)?$/.exec(
      url.pathname,
    );
  if (!match) return undefined;
  const kind = { mon: 'alert', svm: 'service', k8s: 'workload' }[match[1]];
  const resource = {
    id: 'fixture-' + kind,
    label:
      '界面样本 · ' +
      { alert: '推理延迟告警', service: '推理服务', workload: '容器工作负载' }[
        kind
      ],
    kind,
    resourceUid: 'fixture-' + kind,
    clusterId: kind === 'workload' ? '1' : null,
    namespace: kind === 'workload' ? 'default' : null,
    workloadKind: kind === 'workload' ? 'Deployment' : null,
    name: kind === 'workload' ? 'fixture-inference' : null,
    executionMode: 'live',
  };
  const base = {
    schemaVersion: '1.0.0',
    requestId: 'fixture-request',
    sourcePlatform: 'aiops',
    sourceOrigin: 'native',
    capturedAt: '2026-09-13T12:00:00Z',
    executionMode: 'live',
    capabilities: ['read'],
    limitations: ['本地界面夹具，不能作为真实运行证据；线上平台未连接。'],
  };
  if (!match[2])
    return {
      ...base,
      workspaceId: 'fixture-workspace',
      availability: mode === 'empty' ? 'empty' : 'available',
      resources: mode === 'empty' ? [] : [resource],
    };
  if (url.searchParams.get('resourceId') !== resource.id || mode === 'empty')
    return undefined;
  const samples = {
    alert: {
      status: 'firing',
      level: 'warning',
      triggeredAt: null,
      resolvedAt: null,
      description:
        '界面测试样本：最近一条监控记录提示延迟升高。样本仅核验长文本与证据层级，不代表远端健康。',
      advice: '核对服务角色与工作负载事件。',
    },
    service: {
      status: 'running',
      conclusion: 'DEGRADED',
      roleCount: 2,
      runningRoleCount: 1,
      failedRoleCount: 0,
      needRestart: false,
      roles: [
        {
          roleName: '界面样本 A',
          status: 'running',
          hostname: 'fixture-host-a',
        },
        {
          roleName: '界面样本 B',
          status: 'stopped',
          hostname: 'fixture-host-b',
        },
      ],
      reasonCodes: [
        'ROLE_INSTANCE_STOPPED',
        'WINDOW_UNAVAILABLE_SNAPSHOT_ONLY',
      ],
    },
    workload: {
      readyReplicas: 1,
      desiredReplicas: 2,
      availableReplicas: 1,
      metrics: { windowMinutes: 15, cpu: null, memory: null },
      pods: [
        {
          name: 'fixture-inference-a',
          phase: 'Running',
          ready: true,
          restartCount: 0,
        },
        {
          name: 'fixture-inference-b',
          phase: 'Pending',
          ready: false,
          restartCount: 2,
        },
      ],
      events: [
        {
          reason: 'FailedScheduling',
          message: '界面样本：等待可用计算资源',
          count: 2,
        },
      ],
      warnings: ['EXACT_RESOURCE_METRICS_ADAPTER_UNAVAILABLE'],
    },
  };
  return {
    ...base,
    availability: 'available',
    resourceId: resource.id,
    resourceVersion: null,
    observedAt: null,
    freshness: 'unknown',
    data: samples[kind],
  };
}
