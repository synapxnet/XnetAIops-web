/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import { k8sRequestClient } from '#/api/request';
export interface TerminalTarget {
  clusterId: number;
  namespace: string;
  podName: string;
  containerName: string;
}
export interface TerminalTicket {
  ticket: string;
  expiresAt: string;
  webSocketPath: string;
  workspaceId: string;
}
/** 通过现有网页登录和组织Header申请独立终端执行票据。Request an independent terminal execution ticket using existing web authentication and organization headers. */
export function requestTerminalTicket(
  target: TerminalTarget,
): Promise<TerminalTicket> {
  return k8sRequestClient.post<TerminalTicket>('/terminal/tickets', target, {
    timeout: 15_000,
  });
}
/** 只允许服务端返回当前来源的固定终端路径，凭据不放入URL。Accept only the fixed same-origin terminal path and keep credentials out of URLs. */
export function terminalSocketUrl(ticket: TerminalTicket): string {
  if (
    !/^\/api\/k8s\/ws\/terminal\/[1-9][0-9]*\/[a-z0-9.-]+\/[a-z0-9.-]+\/[a-z0-9.-]+$/.test(
      ticket.webSocketPath,
    ) ||
    !/^[A-Za-z0-9_-]{43}$/.test(ticket.ticket) ||
    Date.parse(ticket.expiresAt) <= Date.now() ||
    !Number.isFinite(Date.parse(ticket.expiresAt))
  )
    throw new Error('终端连接票据无效或已过期，请重试。');
  const url = new URL(ticket.webSocketPath, window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
