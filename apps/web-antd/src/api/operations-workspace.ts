/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 原生运行证据网页契约。 Native operations evidence contracts for the Web workspace.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import {
  k8sRequestClient,
  monRequestClient,
  svmRequestClient,
} from '#/api/request';

export type ResourceKind = 'alert' | 'service' | 'workload';
export interface OperationsResource {
  id: string;
  label: string;
  kind: ResourceKind;
  resourceUid: null | string;
  clusterId: null | string;
  namespace: null | string;
  workloadKind: null | string;
  name: null | string;
  executionMode: 'live';
}
export interface OperationsCatalog {
  requestId: string;
  schemaVersion: '1.0.0';
  sourcePlatform: 'aiops';
  capturedAt: string;
  workspaceId: string;
  availability: 'available' | 'empty';
  executionMode: 'live';
  sourceOrigin: 'native';
  resources: OperationsResource[];
  capabilities: string[];
  limitations: string[];
}
export interface OperationsEvidence {
  requestId: string;
  schemaVersion: '1.0.0';
  sourcePlatform: 'aiops';
  capturedAt: string;
  availability: 'available';
  executionMode: 'live';
  sourceOrigin: 'native';
  resourceId: string;
  resourceVersion: null | string;
  observedAt: null | string;
  freshness: string;
  data: Record<string, unknown>;
  capabilities: string[];
  limitations: string[];
}
const clients = {
  alert: monRequestClient,
  service: svmRequestClient,
  workload: k8sRequestClient,
};

/** 通过原生Web身份读取有界目录。 Reads the bounded catalog with the native Web identity. */
export async function getOperationsCatalog(
  kind: ResourceKind,
): Promise<OperationsCatalog> {
  return clients[kind].get('/operations-workspace', { timeout: 15_000 });
}

/** 在所选目录内请求一个证据资源。 Requests one evidence resource within the selected catalog. */
export async function getOperationsEvidence(
  resource: OperationsResource,
): Promise<OperationsEvidence> {
  return clients[resource.kind].get('/operations-workspace/evidence', {
    params: { resourceId: resource.id },
    timeout: 45_000,
  });
}
