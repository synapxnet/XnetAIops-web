/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import BusinessPage from './BusinessPage.vue';
import { publishPageRequest } from '../design/request-state';
/** 挂载真实页面容器及路由，以验证请求提示和草稿保留。Mount the real page container and router to verify request notices and draft preservation. */
async function page() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/test', component: BusinessPage },
      { path: '/other', component: BusinessPage },
    ],
  });
  await router.push('/test');
  const wrapper = mount(BusinessPage, {
    props: {
      title: '表单',
      description: '说明',
      family: '表单',
      routeKey: '/test',
    },
    global: { plugins: [router] },
    slots: { default: '<input aria-label="草稿" value="已填写内容">' },
  });
  return { wrapper, router };
}
/** 验证每个接口独立失败恢复，不重置表单。Verify independent API failure recovery without resetting forms. */
describe('business page request boundaries', () => {
  /** 失败持续可见，且重试其他接口不掩盖未恢复错误。Keep failures visible and do not hide them when another API recovers. */
  it('preserves drafts and clears only the recovered request', async () => {
    const { wrapper } = await page();
    publishPageRequest({
      route: '/test',
      requestKey: 'a',
      failed: true,
      message: 'A服务失败',
    });
    publishPageRequest({
      route: '/test',
      requestKey: 'b',
      failed: true,
      message: 'B服务失败',
    });
    await nextTick();
    expect(wrapper.text()).toContain('A服务失败');
    expect(wrapper.text()).toContain('B服务失败');
    publishPageRequest({
      route: '/test',
      requestKey: 'a',
      failed: false,
      message: '',
    });
    await nextTick();
    expect(wrapper.text()).not.toContain('A服务失败');
    expect(wrapper.text()).toContain('B服务失败');
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe(
      '已填写内容',
    );
    publishPageRequest({
      route: '/test',
      requestKey: 'b',
      failed: false,
      message: '',
    });
    await nextTick();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    wrapper.unmount();
  });
  /** 切换路由后清理提示且忽略旧页面迟到失败。Clear notices on navigation and ignore late failures from the old route. */
  it('ignores errors belonging to another route', async () => {
    const { wrapper, router } = await page();
    publishPageRequest({
      route: '/test',
      requestKey: 'a',
      failed: true,
      message: '旧失败',
    });
    await nextTick();
    await router.push('/other');
    publishPageRequest({
      route: '/test',
      requestKey: 'a',
      failed: true,
      message: '迟到失败',
    });
    await nextTick();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    wrapper.unmount();
  });
  /** 原生hero页面可关闭重复页头而保留请求错误提示。Native hero pages can suppress duplicate headings while retaining request errors. */
  it('avoids duplicate headings on native hero pages', async () => {
    const { wrapper } = await page();
    await wrapper.setProps({ showHeading: false });
    expect(wrapper.find('h1').exists()).toBe(false);
    publishPageRequest({
      route: '/test',
      requestKey: 'a',
      failed: true,
      message: '失败仍可见',
    });
    await nextTick();
    expect(wrapper.text()).toContain('失败仍可见');
    wrapper.unmount();
  });
});
