/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
 * 浮窗服务边界回归 / Floating assistant service-boundary regression.
 * Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AssistantAdapter } from './assistant-adapter';
import AssistantFloatingWindow from './index.vue';

// 简化输入控件尺寸计算，保留真实v-model事件。 Keep real model events without third-party resize internals.
const textAreaStub = { props: ['value', 'disabled'], emits: ['update:value'], template: `<textarea :value="value" :disabled="disabled" @input="$emit('update:value', $event.target.value)" />` };

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('floating assistant service boundary', () => {
  it('shows a disconnected state without requesting invented endpoints', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const wrapper = mount(AssistantFloatingWindow, { props: { visible: true }, global: { stubs: { Teleport: true, ATooltip: { template: '<span><slot /></span>' }, 'ATextarea': textAreaStub, TextArea: textAreaStub } } });
    await flushPromises();
    await wrapper.get('.floating-icon').trigger('click');
    expect(wrapper.text()).toContain('助手服务未连接');
    expect(fetch).not.toHaveBeenCalled();
    await flushPromises();
    wrapper.unmount();
  });

  it('does not stream or discard the draft when conversation creation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const adapter: AssistantAdapter = {
      fetchAssistant: vi.fn().mockResolvedValue({ id: 7, name: 'Workspace helper', gatewayUrl: 'adapter-managed' }),
      createConversation: vi.fn().mockRejectedValue(new Error('workspace denied')),
      addMessage: vi.fn(),
      streamReply: vi.fn(),
    };
    const wrapper = mount(AssistantFloatingWindow, { props: { visible: true, adapter }, global: { stubs: { Teleport: true, ATooltip: { template: '<span><slot /></span>' }, 'ATextarea': textAreaStub, TextArea: textAreaStub } } });
    await flushPromises();
    await wrapper.get('.floating-icon').trigger('click');
    await flushPromises();
    const input = wrapper.get('textarea');
    await input.setValue('Keep my draft');
    await wrapper.vm.$nextTick();
    await wrapper.get('.chat-input button').trigger('click');
    await flushPromises();
    expect(adapter.streamReply).not.toHaveBeenCalled();
    expect(adapter.addMessage).not.toHaveBeenCalled();
    expect((input.element as HTMLTextAreaElement).value).toBe('Keep my draft');
    await flushPromises();
    wrapper.unmount();
  });
});
