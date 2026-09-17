/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
export interface PageRequestState {
  route: string;
  requestKey: string;
  failed: boolean;
  message: string;
}
export const PAGE_REQUEST_EVENT = 'synapxnet:aiops:page-request';
/** 发布不含令牌或业务载荷的页面请求状态。Publish request status without tokens or business payloads. */
export function publishPageRequest(state: PageRequestState): void {
  window.dispatchEvent(new CustomEvent(PAGE_REQUEST_EVENT, { detail: state }));
}
