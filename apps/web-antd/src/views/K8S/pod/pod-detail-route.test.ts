/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：验证 Pod 详情的真实路由、缓存和参数错误。Purpose: Verify real Pod detail routing, caching and invalid parameter states.
Author: maoyo | Department: 研发部 | Date: 2026-09-14
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import type { VNode } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { PodDetail, PodReadApi } from './use-pod-detail';

import { flushPromises, mount } from '@vue/test-utils';
import { cloneVNode, defineComponent, h, KeepAlive, shallowRef } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 仅隔离网络和编辑器，挂载真实详情组件及 Ant 界面。Isolate only network and editor dependencies while mounting the real detail and Ant UI.
const api = vi.hoisted(() => ({
  getPod: vi.fn<PodReadApi['getPod']>(),
  getPodContainers: vi.fn<PodReadApi['getPodContainers']>(),
  getPodEvents: vi.fn<PodReadApi['getPodEvents']>(),
  getPodLogs: vi.fn<PodReadApi['getPodLogs']>(),
}));
vi.mock('../api/pod', () => api);
vi.mock('../components/YamlEditor.vue', () => ({
  default: { template: '<div />' },
}));
import PodDetailPage from './detail.vue';
import k8sRoutes from '../../../router/routes/modules/K8S';

/** 构造能与路由标题区分的已读取资料。Create fetched data distinguishable from the route title. */
function podSample(name: string): PodDetail {
  return {
    name: `${name}-loaded`,
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    readyCount: 1,
    totalContainers: 1,
    restarts: 0,
    images: ['api:v1'],
    createdAt: '2026-09-14T08:00:00Z',
  };
}

/** 控制迟到请求及恢复中的读取，不依赖定时器。Control late requests and pending reactivation reads without timers. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

/** 按生产布局使用 RouterView、KeepAlive 和 fullPath 键挂载真实页面。Mount the real page with RouterView, KeepAlive and fullPath keys matching the production layout. */
async function routePage(path: string) {
  const podRoute = k8sRoutes[0]?.children?.find(
    (route) => route.name === 'K8sPodDetail',
  );
  if (!podRoute?.meta) throw new Error('Production Pod route metadata missing');
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        name: podRoute.name,
        path: podRoute.path,
        component: PodDetailPage,
        meta: { ...podRoute.meta },
      },
      {
        name: 'K8sPodList',
        path: '/K8S/pod/list',
        component: { template: '<p>Pod 列表</p>' },
      },
    ],
  });
  const cachedNames = shallowRef<string[]>([]);
  // 与 tabbar.updateCacheTabs 一致，只有已打开且 meta.keepAlive 为真的路由才能进入 include。Match tabbar.updateCacheTabs by including only opened routes whose meta.keepAlive is true.
  router.afterEach((route) => {
    if (route.meta.keepAlive && typeof route.name === 'string') {
      cachedNames.value = [...new Set([...cachedNames.value, route.name])];
    }
  });
  const shell = defineComponent({
    /** 保持真实路由组件实例的缓存行为。Preserve actual routed component instance caching. */
    setup() {
      return () =>
        h(RouterView, null, {
          default: ({
            Component,
            route,
          }: {
            Component: VNode;
            route: RouteLocationNormalizedLoaded;
          }) =>
            h(
              KeepAlive,
              { include: cachedNames.value },
              {
                default: () =>
                  Component
                    ? cloneVNode(Component, { key: route.fullPath })
                    : [],
              },
            ),
        });
    },
  });
  await router.push(path);
  const wrapper = mount(shell, {
    global: {
      plugins: [router],
      stubs: { BusinessPage: { template: '<section><slot /></section>' } },
    },
  });
  await flushPromises();
  return { wrapper, router };
}

/** 每个用例从正常独立读取开始，避免跨用例保留模拟状态。Start each case with independent successful reads and no retained mock state. */
beforeEach(() => {
  vi.resetAllMocks();
  api.getPod.mockImplementation(async (_cluster, _namespace, name) =>
    podSample(name),
  );
  api.getPodContainers.mockResolvedValue([
    { name: 'api', image: 'api:v1', isInit: false },
  ]);
  api.getPodEvents.mockResolvedValue([]);
  api.getPodLogs.mockResolvedValue('ready');
});

/** 通过真实导航检验缓存及错误界面，不直接调用失活方法。Verify caching and error UI through real navigation instead of calling deactivation directly. */
describe('Pod detail route and cache boundaries', () => {
  /** 生产 include 允许缓存后，返回时的读取失败仍保留原资料及失败提示。With production include-based caching, retain previous data and show failure when a return refresh fails. */
  it('retains cached successful data after return reads fail under production include rules', async () => {
    const path = '/K8S/pod/detail/7/production/api-a';
    const { wrapper, router } = await routePage(path);
    expect(wrapper.text()).toContain('api-a-loaded');
    await router.push('/K8S/pod/list');
    await flushPromises();
    api.getPod.mockRejectedValueOnce(new Error('unavailable'));
    api.getPodContainers.mockRejectedValueOnce(new Error('unavailable'));
    api.getPodEvents.mockRejectedValueOnce(new Error('unavailable'));
    await router.push(path);
    await flushPromises();
    expect(wrapper.text()).toContain('api-a-loaded');
    expect(wrapper.text()).toContain('Running');
    expect(wrapper.text()).toContain('上次读取');
    expect(wrapper.text()).toContain('基本资料读取失败');
    expect(wrapper.text()).toContain('容器 (读取失败)');
    expect(api.getPod).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  /** 离开列表不清空缓存，返回期间继续显示上次读取资料。Keep cached data when leaving for the list and show it while the return refresh is pending. */
  it('preserves fetched data across detail to list to cached detail navigation', async () => {
    const path = '/K8S/pod/detail/7/production/api-a';
    const { wrapper, router } = await routePage(path);
    expect(wrapper.text()).toContain('api-a-loaded');
    await router.push('/K8S/pod/list');
    await flushPromises();
    expect(api.getPod).toHaveBeenCalledTimes(1);
    const pending = deferred<PodDetail>();
    api.getPod.mockReturnValueOnce(pending.promise);
    await router.push(path);
    await flushPromises();
    expect(api.getPod).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('api-a-loaded');
    expect(wrapper.text()).toContain('上次读取');
    pending.resolve({ ...podSample('api-a'), name: 'api-a-refreshed' });
    await flushPromises();
    expect(wrapper.text()).toContain('api-a-refreshed');
    wrapper.unmount();
  });

  /** 其他 Pod 使用自己的缓存实例，旧在途响应与全局路由变化都不能覆盖 A。Give other Pods separate cached instances and prevent late reads or global route changes from overwriting A. */
  it('isolates cached Pod identities and ignores reads completed after navigation', async () => {
    const pathA = '/K8S/pod/detail/7/production/api-a';
    const { wrapper, router } = await routePage(pathA);
    const old = deferred<PodDetail>();
    api.getPod.mockReturnValueOnce(old.promise);
    const refreshButton = wrapper
      .findAll('button')
      .find((button) => button.text().replaceAll(' ', '') === '刷新资料');
    expect(refreshButton).toBeDefined();
    await refreshButton!.trigger('click');
    await router.push('/K8S/pod/detail/7/production/api-b');
    await flushPromises();
    expect(wrapper.text()).toContain('api-b-loaded');
    expect(api.getPod.mock.calls.map((call) => call[2])).toEqual([
      'api-a',
      'api-a',
      'api-b',
    ]);
    old.resolve({ ...podSample('api-a'), name: 'api-a-late' });
    await flushPromises();
    await router.push('/K8S/pod/list');
    const current = deferred<PodDetail>();
    api.getPod.mockReturnValueOnce(current.promise);
    await router.push(pathA);
    await flushPromises();
    expect(wrapper.text()).toContain('api-a-loaded');
    expect(wrapper.text()).not.toContain('api-a-late');
    expect(wrapper.text()).not.toContain('api-b-loaded');
    expect(api.getPod.mock.calls.map((call) => call[2])).toEqual([
      'api-a',
      'api-a',
      'api-b',
      'api-a',
    ]);
    current.resolve(podSample('api-a'));
    await flushPromises();
    wrapper.unmount();
  });

  /** 无效集群参数应明确报错且不读取；返回列表操作仍可使用。Report invalid cluster parameters without reading data, while keeping return-to-list usable. */
  it.each(['abc', '0'])(
    'shows an actionable parameter error for cluster %s without API calls',
    async (cluster) => {
      const { wrapper, router } = await routePage(
        `/K8S/pod/detail/${cluster}/production/api-a`,
      );
      expect(wrapper.text()).toContain('Pod 地址参数无效');
      expect(wrapper.text()).not.toContain('正在读取');
      expect(api.getPod).not.toHaveBeenCalled();
      expect(api.getPodContainers).not.toHaveBeenCalled();
      expect(api.getPodEvents).not.toHaveBeenCalled();
      expect(api.getPodLogs).not.toHaveBeenCalled();
      const backButton = wrapper
        .findAll('button')
        .find((button) => button.text() === '返回列表');
      expect(backButton).toBeDefined();
      await backButton!.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/K8S/pod/list');
      expect(router.currentRoute.value.query.clusterId).toBeUndefined();
      wrapper.unmount();
    },
  );
});
