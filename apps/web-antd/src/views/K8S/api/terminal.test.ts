/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import { describe, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ post: vi.fn() }));
/** 阻止测试发起真实认证请求。Prevent tests from issuing real authentication requests. */
vi.mock('#/api/request', () => ({ k8sRequestClient: calls }));
import { requestTerminalTicket, terminalSocketUrl } from './terminal';
/** 验证终端票据与同源连接边界。Verify terminal tickets and same-origin connection boundaries. */
describe('terminal connection contract', () => {
  /** 有效票据仅在子协议使用，连接地址不携带凭据。Use valid tickets only as subprotocols without placing credentials in connection URLs. */
  it('builds a same-origin socket URL without credentials', () => {
    const ticket = {
      ticket: 'a'.repeat(43),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
      webSocketPath: '/api/k8s/ws/terminal/1/team/pod/app',
      workspaceId: 'project',
    };
    const url = terminalSocketUrl(ticket);
    expect(url).toMatch(/^wss?:/);
    expect(new URL(url).host).toBe(window.location.host);
    expect(url).not.toContain(ticket.ticket);
    expect(new URL(url).search).toBe('');
  });
  /** 远程路径、过期和非法票据均不能打开连接。Remote paths, expired tickets and malformed tickets cannot open connections. */
  it('rejects expired, malformed and cross-origin responses', () => {
    const ticket = {
      ticket: 'a'.repeat(43),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
      webSocketPath: '/api/k8s/ws/terminal/1/team/pod/app',
      workspaceId: 'project',
    };
    for (const patch of [
      { expiresAt: new Date(Date.now() - 1).toISOString() },
      { expiresAt: 'invalid' },
      { ticket: 'short' },
      { webSocketPath: 'https://remote.invalid/ws/terminal/1/team/pod/app' },
      { webSocketPath: '//remote.invalid/ws' },
      { webSocketPath: '/api/k8s/ws/terminal/1/team/pod/app?token=secret' },
    ])
      expect(() => terminalSocketUrl({ ...ticket, ...patch })).toThrow();
  });
  /** 请求沿既有认证客户端传递精确资源，无端口直连。Send exact targets through the existing authenticated client without direct-port connections. */
  it('requests a ticket through the bounded authenticated API', async () => {
    const target = {
      clusterId: 1,
      namespace: 'team',
      podName: 'pod',
      containerName: 'app',
    };
    calls.post.mockResolvedValueOnce({ ticket: 'fixture' });
    await requestTerminalTicket(target);
    expect(calls.post).toHaveBeenCalledWith('/terminal/tickets', target, {
      timeout: 15000,
    });
  });
});
