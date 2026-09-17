/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：验证 Pod 分区读取、对象切换和日志隔离。Purpose: Verify Pod section reads, object changes and log isolation.
Author: maoyo | Department: 研发部 | Date: 2026-09-14
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import { describe, expect, it, vi } from 'vitest';

import type { K8sContainerDetail, K8sEvent } from '../api/types';
import type { PodDetail, PodIdentity, PodReadApi } from './use-pod-detail';

import { podSectionTab, usePodDetail } from './use-pod-detail';

const firstTarget: PodIdentity = {
  clusterId: 7,
  namespace: 'production',
  podName: 'api-a',
};
const secondTarget: PodIdentity = { ...firstTarget, podName: 'api-b' };
const containerA: K8sContainerDetail = {
  name: 'api',
  image: 'api:v1',
  isInit: false,
};
const containerB: K8sContainerDetail = {
  name: 'sidecar',
  image: 'sidecar:v1',
  isInit: false,
};

/** 构造真实接口字段形状的 Pod 样本。Create a Pod sample with the actual API field shape. */
function podSample(name = firstTarget.podName): PodDetail {
  return {
    name,
    namespace: firstTarget.namespace,
    status: 'Running',
    ready: '1/1',
    readyCount: 1,
    totalContainers: 1,
    restarts: 0,
    images: ['api:v1'],
    createdAt: '2026-09-14T08:00:00Z',
    serviceAccount: 'default',
    restartPolicy: 'Always',
    dnsPolicy: 'ClusterFirst',
    yaml: `kind: Pod\nmetadata:\n  name: ${name}`,
  };
}

/** 创建可精确控制返回顺序的请求。Create a request with explicitly controlled completion order. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

/** 提供可独立失败与恢复的 API，测试不连接真实集群。Provide independently failing and recovering API mocks without connecting to a cluster. */
function testApi() {
  return {
    getPod: vi.fn<PodReadApi['getPod']>().mockResolvedValue(podSample()),
    getPodContainers: vi
      .fn<PodReadApi['getPodContainers']>()
      .mockResolvedValue([containerA, containerB]),
    getPodEvents: vi.fn<PodReadApi['getPodEvents']>().mockResolvedValue([]),
    getPodLogs: vi.fn<PodReadApi['getPodLogs']>().mockResolvedValue('ready\n'),
  };
}

/** 验证真实页面复用的状态控制器，包括成功、失败和迟到响应。Exercise the state controller used by the real page, including success, failure and late responses. */
describe('Pod detail section reads', () => {
  /** 主资料失败也不能隐藏已成功的容器、事件及可读取的日志。Keep successful auxiliary sections and readable logs available even when primary data fails. */
  it('keeps auxiliary sections usable when the primary read fails', async () => {
    const api = testApi();
    api.getPod.mockRejectedValueOnce(new Error('primary unavailable'));
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    expect(reader.podState.value.data).toBeNull();
    expect(reader.podState.value.error).not.toBe('');
    expect(reader.containerState.value.data).toEqual([containerA, containerB]);
    expect(reader.eventState.value.data).toEqual([]);
    await reader.refreshLogs();
    expect(reader.logState.value.data).toBe('ready\n');
    expect(reader.podState.value.error).not.toBe('');
  });

  /** 附属接口失败不丢弃主资料，失败列表不显示正常零条。Keep primary data when auxiliary reads fail and never label failed lists as valid zero rows. */
  it('keeps primary data and distinguishes failure from a valid empty section', async () => {
    const api = testApi();
    api.getPodContainers.mockRejectedValueOnce(
      new Error('container unavailable'),
    );
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);

    expect(reader.podState.value.data?.name).toBe('api-a');
    expect(reader.podState.value.data?.serviceAccount).toBe('default');
    expect(reader.containerState.value.data).toBeNull();
    expect(reader.containerState.value.error).not.toBe('');
    expect(podSectionTab('容器', reader.containerState.value, 0)).toBe(
      '容器 (读取失败)',
    );
    expect(reader.eventState.value.data).toEqual([]);
    expect(podSectionTab('事件', reader.eventState.value, 0)).toBe('事件 (0)');
  });

  /** 某个分区仍在等待时，已成功的主资料应立即可见。Expose completed primary data while a different section is still pending. */
  it('publishes completed sections before the slowest section settles', async () => {
    const api = testApi();
    const waiting = deferred<K8sEvent[]>();
    api.getPodEvents.mockReturnValueOnce(waiting.promise);
    const reader = usePodDetail(api);
    const request = reader.setTarget(firstTarget);
    await vi.waitFor(() =>
      expect(reader.podState.value.data?.name).toBe('api-a'),
    );
    expect(reader.podState.value.pending).toBe(false);
    expect(reader.eventState.value.pending).toBe(true);
    waiting.resolve([]);
    await request;
  });

  /** 独立重试只清除恢复分区的错误，不重取其他资料。Clear only the recovered section error without rereading unrelated data. */
  it('recovers one failed section without clearing another failure', async () => {
    const api = testApi();
    api.getPodContainers.mockRejectedValueOnce(
      new Error('containers unavailable'),
    );
    api.getPodEvents.mockRejectedValueOnce(new Error('events unavailable'));
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    await reader.refreshContainers();

    expect(reader.containerState.value.error).toBe('');
    expect(reader.containerState.value.data).toEqual([containerA, containerB]);
    expect(reader.selectedContainer.value).toBe('api');
    expect(reader.eventState.value.error).not.toBe('');
    expect(api.getPod).toHaveBeenCalledTimes(1);
    expect(api.getPodEvents).toHaveBeenCalledTimes(1);
    await reader.refreshEvents();
    expect(reader.eventState.value.error).toBe('');
  });

  /** 同一对象刷新保留成功资料并标旧，失败后仍保留，成功后更新状态。Keep and mark same-object data stale during refresh and failure, then clear staleness on recovery. */
  it('retains the last successful data while a same-object refresh fails', async () => {
    const api = testApi();
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    const readAt = reader.podState.value.readAt;
    const waiting = deferred<PodDetail>();
    api.getPod.mockReturnValueOnce(waiting.promise);
    const refresh = reader.refreshPod();
    expect(reader.podState.value.data?.name).toBe('api-a');
    expect(reader.podState.value.stale).toBe(true);
    expect(reader.podState.value.pending).toBe(true);
    waiting.reject(new Error('unavailable'));
    await refresh;
    expect(reader.podState.value.data?.name).toBe('api-a');
    expect(reader.podState.value.readAt).toBe(readAt);
    expect(reader.podState.value.stale).toBe(true);
    expect(reader.podState.value.pending).toBe(false);
    expect(reader.podState.value.error).not.toBe('');
    await reader.refreshPod();
    expect(reader.podState.value.error).toBe('');
    expect(reader.podState.value.stale).toBe(false);
  });

  /** 较早刷新无论成功或失败，都不得覆盖新刷新。Reject older refresh success or failure after a newer refresh completes. */
  it.each(['success', 'failure'] as const)(
    'ignores an older refresh %s',
    async (outcome) => {
      const api = testApi();
      const reader = usePodDetail(api);
      await reader.setTarget(firstTarget);
      const old = deferred<PodDetail>();
      api.getPod
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce({ ...podSample(), status: 'Pending' });
      const previous = reader.refreshPod();
      await reader.refreshPod();
      if (outcome === 'success')
        old.resolve({ ...podSample(), status: 'Failed' });
      else old.reject(new Error('old failure'));
      await previous;
      expect(reader.podState.value.data?.status).toBe('Pending');
      expect(reader.podState.value.error).toBe('');
      expect(reader.podState.value.stale).toBe(false);
    },
  );

  /** 对象切换立即清空全部旧资料，旧响应不能恢复旧对象或容器选择。Clear all data on object changes and prevent late responses from restoring old objects or selections. */
  it('clears previous object data and rejects late object responses', async () => {
    const api = testApi();
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    await reader.refreshLogs();
    const oldPod = deferred<PodDetail>();
    const oldContainers = deferred<K8sContainerDetail[]>();
    const newPod = deferred<PodDetail>();
    const newContainers = deferred<K8sContainerDetail[]>();
    const newEvents = deferred<K8sEvent[]>();
    api.getPod
      .mockReturnValueOnce(oldPod.promise)
      .mockReturnValueOnce(newPod.promise);
    api.getPodContainers
      .mockReturnValueOnce(oldContainers.promise)
      .mockReturnValueOnce(newContainers.promise);
    const previous = reader.refresh();
    api.getPodEvents.mockReturnValueOnce(newEvents.promise);
    const next = reader.setTarget(secondTarget);

    expect(reader.podState.value.data).toBeNull();
    expect(reader.containerState.value.data).toBeNull();
    expect(reader.eventState.value.data).toBeNull();
    expect(reader.logState.value.data).toBeNull();
    expect(reader.selectedContainer.value).toBe('');
    oldPod.resolve(podSample());
    oldContainers.resolve([containerA]);
    await previous;
    expect(reader.podState.value.data).toBeNull();
    expect(reader.selectedContainer.value).toBe('');
    expect(reader.podState.value.pending).toBe(true);

    newPod.resolve(podSample(secondTarget.podName));
    newContainers.resolve([containerB]);
    newEvents.resolve([]);
    await next;
    expect(reader.podState.value.data?.name).toBe('api-b');
    expect(reader.selectedContainer.value).toBe('sidecar');
  });

  /** 日志按容器隔离，切换后立即清空旧文本并拒绝迟到日志。Isolate logs by container, clear previous text immediately, and reject late log responses. */
  it('isolates container logs and records a read failure outside log content', async () => {
    const api = testApi();
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    await reader.refreshLogs();
    const oldLogs = deferred<string>();
    const currentLogs = deferred<string>();
    api.getPodLogs
      .mockReturnValueOnce(oldLogs.promise)
      .mockReturnValueOnce(currentLogs.promise);
    const previous = reader.refreshLogs();
    reader.selectContainer('sidecar');
    expect(reader.logState.value.data).toBeNull();
    const current = reader.refreshLogs();
    currentLogs.reject(new Error('private upstream failure'));
    await current;
    expect(reader.logState.value.error).not.toBe('');
    expect(reader.logState.value.data).toBeNull();
    oldLogs.resolve('api old log');
    await previous;
    expect(reader.logState.value.data).toBeNull();
    expect(reader.logState.value.error).not.toBe('');
    expect(reader.selectedContainer.value).toBe('sidecar');
    expect(api.getPodLogs).toHaveBeenLastCalledWith(
      7,
      'production',
      'api-a',
      'sidecar',
      500,
    );
  });

  /** 同容器重试日志失败应保留上次成功日志并标注旧内容。Preserve and mark previous successful logs when a same-container retry fails. */
  it('preserves previous successful log text without replacing it with an error', async () => {
    const api = testApi();
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    await reader.refreshLogs();
    api.getPodLogs.mockRejectedValueOnce(new Error('failure'));
    await reader.refreshLogs();
    expect(reader.logState.value.data).toBe('ready\n');
    expect(reader.logState.value.stale).toBe(true);
    expect(reader.logState.value.error).not.toBe('');
  });

  /** 失活阻止所有在途资料和日志更新，恢复页面后重新读取。Block all in-flight section and log updates while deactivated, then reread on activation. */
  it('invalidates pending work on deactivation and refreshes on reactivation', async () => {
    const api = testApi();
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    const pendingPod = deferred<PodDetail>();
    const pendingContainers = deferred<K8sContainerDetail[]>();
    const pendingEvents = deferred<K8sEvent[]>();
    const pendingLogs = deferred<string>();
    api.getPod.mockReturnValueOnce(pendingPod.promise);
    api.getPodContainers.mockReturnValueOnce(pendingContainers.promise);
    api.getPodEvents.mockReturnValueOnce(pendingEvents.promise);
    api.getPodLogs.mockReturnValueOnce(pendingLogs.promise);
    const refresh = reader.refresh();
    const logs = reader.refreshLogs();
    reader.deactivate();
    pendingPod.resolve({ ...podSample(), status: 'Failed' });
    pendingContainers.resolve([containerB]);
    pendingEvents.reject(new Error('late event failure'));
    pendingLogs.resolve('late log');
    await Promise.all([refresh, logs]);
    expect(reader.podState.value.data?.status).toBe('Running');
    expect(reader.containerState.value.data).toEqual([containerA, containerB]);
    expect(reader.eventState.value.error).toBe('');
    expect(reader.logState.value.data).toBeNull();
    expect(reader.podState.value.pending).toBe(false);
    expect(reader.podState.value.stale).toBe(true);
    await reader.refresh();
    expect(api.getPod).toHaveBeenCalledTimes(2);
    await reader.activate();
    expect(api.getPod).toHaveBeenCalledTimes(3);
    expect(reader.podState.value.stale).toBe(false);
  });

  /** 空日志也是已读取状态，初始化容器不参与普通日志选择。Treat empty log text as a successful read and exclude init containers from regular log selection. */
  it('selects only a regular container and avoids rereading successful empty logs', async () => {
    const api = testApi();
    api.getPodContainers.mockResolvedValueOnce([
      { ...containerB, isInit: true },
      containerA,
    ]);
    api.getPodLogs.mockResolvedValue('');
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    expect(reader.selectedContainer.value).toBe('api');
    expect(reader.mainContainers.value).toEqual([containerA]);
    await reader.refreshLogs();
    reader.setLogsActive(true);
    expect(reader.logState.value.data).toBe('');
    expect(reader.logState.value.error).toBe('');
    expect(api.getPodLogs).toHaveBeenCalledTimes(1);
  });

  /** 恢复日志页时，慢事件请求不能阻塞独立日志读取。A slow event request must not block independent log reads when reactivating the log tab. */
  it('refreshes logs independently of slow events on reactivation', async () => {
    const api = testApi();
    const reader = usePodDetail(api);
    await reader.setTarget(firstTarget);
    await reader.refreshLogs();
    reader.setLogsActive(true);
    reader.deactivate();
    const pendingEvents = deferred<K8sEvent[]>();
    api.getPodEvents.mockReturnValueOnce(pendingEvents.promise);
    api.getPodLogs.mockResolvedValueOnce('current log');
    const request = reader.activate();
    await vi.waitFor(() =>
      expect(reader.logState.value.data).toBe('current log'),
    );
    expect(reader.eventState.value.pending).toBe(true);
    expect(reader.logState.value.stale).toBe(false);
    pendingEvents.resolve([]);
    await request;
  });
});
