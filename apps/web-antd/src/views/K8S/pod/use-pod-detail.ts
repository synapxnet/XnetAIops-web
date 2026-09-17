/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：Pod 分区资料和日志读取状态。Purpose: Independent Pod section and log read state.
Author: maoyo | Department: 研发部 | Date: 2026-09-14
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  shallowRef,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import type { K8sContainerDetail, K8sEvent, K8sPod } from '../api/types';

export interface PodDetail extends K8sPod {
  dnsPolicy?: string;
  restartPolicy?: string;
  serviceAccount?: string;
}

export interface PodIdentity {
  clusterId: number;
  namespace: string;
  podName: string;
}

export interface PodReadApi {
  getPod: (
    clusterId: number,
    namespace: string,
    podName: string,
  ) => Promise<PodDetail>;
  getPodContainers: (
    clusterId: number,
    namespace: string,
    podName: string,
  ) => Promise<K8sContainerDetail[]>;
  getPodEvents: (
    clusterId: number,
    namespace: string,
    podName: string,
  ) => Promise<K8sEvent[]>;
  getPodLogs: (
    clusterId: number,
    namespace: string,
    podName: string,
    container: string,
    tailLines: number,
  ) => Promise<string>;
}

export interface PodReadSection<T> {
  data: T | null;
  error: string;
  pending: boolean;
  readAt: number | null;
  stale: boolean;
}

/** 创建尚未读取的分区；正常空值只能来自成功读取。Create an unread section; valid empty values require a successful read. */
function emptySection<T>(): PodReadSection<T> {
  return { data: null, error: '', pending: false, readAt: null, stale: false };
}

/** 读取单个分区并隔离旧响应，刷新时保留最近成功资料。Read one section with generation isolation and retain successful data during refresh. */
function createReadSection<T>() {
  const state = shallowRef<PodReadSection<T>>(emptySection<T>());
  let generation = 0;

  /** 每次读取只更新本分区；失败不改写成功资料或其他错误。Update only this section; failures do not replace successful data or unrelated errors. */
  async function read(loader: () => Promise<T>) {
    const ticket = ++generation;
    state.value = {
      ...state.value,
      pending: true,
      stale: state.value.readAt !== null,
    };
    try {
      const data = await loader();
      if (ticket !== generation) return { accepted: false } as const;
      state.value = {
        data,
        error: '',
        pending: false,
        readAt: Date.now(),
        stale: false,
      };
      return { accepted: true, data, generation: ticket } as const;
    } catch {
      if (ticket === generation) {
        state.value = {
          ...state.value,
          error: '读取失败，请稍后重试或检查连接。',
          pending: false,
        };
      }
      return { accepted: false } as const;
    }
  }

  /** 离开页面使在途请求失效并标明保留资料已过期。Invalidate in-flight reads when leaving and mark retained data stale. */
  function invalidate() {
    generation += 1;
    state.value = {
      ...state.value,
      pending: false,
      stale: state.value.readAt !== null,
    };
  }

  /** 切换对象或容器时清空旧资料并使旧请求失效。Clear old data and invalidate requests when switching objects or containers. */
  function reset() {
    generation += 1;
    state.value = emptySection<T>();
  }

  /** 在读取后的异步副作用前再次核对请求代次。Recheck the generation before asynchronous post-read side effects. */
  function accepts(ticket: number) {
    return ticket === generation;
  }

  return { state, read, invalidate, reset, accepts };
}

/** 让标签区别成功零条、尚未读取和失败，避免把失败显示成健康空列表。Distinguish successful zero rows, unread state and failure in tab labels. */
export function podSectionTab<T>(
  label: string,
  state: PodReadSection<T>,
  count: number,
): string {
  if (state.error) return `${label} (读取失败)`;
  if (state.pending) return `${label} (读取中)`;
  if (state.readAt === null) return `${label} (未读取)`;
  return `${label} (${count}${state.stale ? ' · 上次读取' : ''})`;
}

/** 展示同一对象保留资料的读取时刻。Describe when retained data for the same object was last read. */
export function podReadTime(readAt: number | null): string {
  return readAt === null
    ? ''
    : new Date(readAt).toLocaleTimeString('zh-CN', { hour12: false });
}

/** 为 Pod 详情复用独立分区读取，并隔离对象、刷新代次与容器日志。Compose independent Pod reads isolated by object, request generation and log container. */
export function usePodDetail(api: PodReadApi) {
  const pod = createReadSection<PodDetail>();
  const containers = createReadSection<K8sContainerDetail[]>();
  const events = createReadSection<K8sEvent[]>();
  const logs = createReadSection<string>();
  const selectedContainer = shallowRef('');
  const targetError = shallowRef('');
  let target: PodIdentity | null = null;
  let active = true;
  let logsActive = false;

  /** 从已成功读取的容器资料提供可选项。Provide selectable containers only from successful container reads. */
  const mainContainers = computed(() =>
    (containers.state.value.data ?? []).filter((item) => !item.isInit),
  );

  /** 只读取当前活动对象的基本资料。Read basic data for the active object only. */
  async function refreshPod() {
    if (!active || !target) return;
    const { clusterId, namespace, podName } = target;
    await pod.read(async () => {
      // 拒绝空包络，不能把缺失资料显示成成功。Reject missing data instead of reporting a successful read.
      const data = await api.getPod(clusterId, namespace, podName);
      if (!data || typeof data !== 'object')
        throw new Error('Missing Pod data');
      return data;
    });
  }

  /** 容器读取成功后保留有效选择，否则选择第一个普通容器。Keep a valid selection after container recovery, otherwise select the first regular container. */
  async function refreshContainers() {
    if (!active || !target) return;
    const { clusterId, namespace, podName } = target;
    const result = await containers.read(async () => {
      // 格式异常属于读取失败，不是正常零条。An invalid response is a read failure, not a valid zero count.
      const data = await api.getPodContainers(clusterId, namespace, podName);
      if (!Array.isArray(data)) throw new Error('Invalid container list');
      return data;
    });
    if (!result.accepted || !containers.accepts(result.generation)) return;
    if (
      !mainContainers.value.some(
        (item) => item.name === selectedContainer.value,
      )
    ) {
      selectContainer(mainContainers.value[0]?.name ?? '');
    }
  }

  /** 独立重试事件，不清除其他分区的错误。Retry events independently without clearing other section errors. */
  async function refreshEvents() {
    if (!active || !target) return;
    const { clusterId, namespace, podName } = target;
    await events.read(async () => {
      // 格式异常不应被转换为无事件。Do not convert an invalid response into an empty event list.
      const data = await api.getPodEvents(clusterId, namespace, podName);
      if (!Array.isArray(data)) throw new Error('Invalid event list');
      return data;
    });
  }

  /** 日志使用独立请求代次，错误只进入错误状态。Read logs with an independent generation and keep failures out of log contents. */
  async function refreshLogs() {
    if (!active || !target || !selectedContainer.value) return;
    const { clusterId, namespace, podName } = target;
    const container = selectedContainer.value;
    await logs.read(async () => {
      // 仅接收真实日志文本，禁止把对象或错误转换成日志。Accept real log text instead of stringifying objects or errors as logs.
      const data = await api.getPodLogs(
        clusterId,
        namespace,
        podName,
        container,
        500,
      );
      if (typeof data !== 'string') throw new Error('Invalid log text');
      return data;
    });
  }

  /** 切容器立即清理旧日志，在日志页才自动读取。Clear previous logs immediately on container changes and auto-read only in the log tab. */
  function selectContainer(name: string) {
    if (selectedContainer.value === name) return;
    selectedContainer.value = name;
    logs.reset();
    if (logsActive) void refreshLogs();
  }

  /** 日志页打开时读取未加载或上次失败的当前容器。Read the selected container when opening an unread or failed log tab. */
  function setLogsActive(value: boolean) {
    logsActive = value;
    if (
      value &&
      !logs.state.value.pending &&
      (logs.state.value.readAt === null ||
        logs.state.value.stale ||
        logs.state.value.error)
    ) {
      void refreshLogs();
    }
  }

  /** 并行刷新各分区；每个分区自行处理成功与失败。Refresh sections concurrently while each handles its own success and failure. */
  async function refresh() {
    await Promise.all([refreshPod(), refreshContainers(), refreshEvents()]);
  }

  /** 对象身份改变时清空全部旧资料，然后读取新对象。Clear all previous data before reading a different Pod identity. */
  async function setTarget(next: PodIdentity) {
    if (
      target?.clusterId === next.clusterId &&
      target.namespace === next.namespace &&
      target.podName === next.podName
    )
      return;
    pod.reset();
    containers.reset();
    events.reset();
    logs.reset();
    selectedContainer.value = '';
    target =
      Number.isSafeInteger(next.clusterId) &&
      next.clusterId > 0 &&
      next.namespace.trim() &&
      next.podName.trim()
        ? { ...next }
        : null;
    targetError.value = target
      ? ''
      : 'Pod 地址参数无效，请返回列表重新选择集群和 Pod。';
    await refresh();
  }

  /** 缓存页失活或卸载时禁止迟到响应与后续读取。Reject late responses and new reads when deactivated or unmounted. */
  function deactivate() {
    active = false;
    pod.invalidate();
    containers.invalidate();
    events.invalidate();
    logs.invalidate();
  }

  /** 恢复缓存页时重新读取，首个挂载不重复请求。Refresh on reactivation without duplicating the initial mount request. */
  async function activate() {
    if (active) return;
    active = true;
    await Promise.all([
      refresh(),
      logsActive ? refreshLogs() : Promise.resolve(),
    ]);
  }

  return {
    podState: pod.state,
    containerState: containers.state,
    eventState: events.state,
    logState: logs.state,
    selectedContainer,
    targetError,
    mainContainers,
    refreshPod,
    refreshContainers,
    refreshEvents,
    refreshLogs,
    refresh,
    selectContainer,
    setLogsActive,
    setTarget,
    activate,
    deactivate,
  };
}

/** 将实例绑定到主布局的 fullPath 缓存键，离开时只失效，返回时恢复原对象。Bind the instance to the layout fullPath cache key, invalidating on exit and restoring its own object on return. */
export function useRoutedPodDetail(api: PodReadApi) {
  const route = useRoute();
  const instanceRouteKey = route.fullPath;
  const identity: PodIdentity = {
    clusterId:
      typeof route.params.clusterId === 'string'
        ? Number(route.params.clusterId)
        : Number.NaN,
    namespace:
      typeof route.params.namespace === 'string' ? route.params.namespace : '',
    podName:
      typeof route.params.podName === 'string' ? route.params.podName : '',
  };
  const reader = usePodDetail(api);
  void reader.setTarget(identity);

  // 路由变更先于缓存失活钩子，因此同步失效，且不读取其他实例的参数。Route updates precede KeepAlive deactivation, so invalidate synchronously without reading another instance's parameters.
  watch(
    () => route.fullPath,
    (nextKey) => {
      if (nextKey !== instanceRouteKey) reader.deactivate();
    },
    { flush: 'sync' },
  );

  /** 仅当前匹配的缓存实例可以恢复读取。Only the cached instance matching the current route may resume reads. */
  function activateOwnRoute() {
    if (route.fullPath === instanceRouteKey) void reader.activate();
  }

  onActivated(activateOwnRoute);
  onDeactivated(reader.deactivate);
  onBeforeUnmount(reader.deactivate);
  return { ...reader, identity };
}
