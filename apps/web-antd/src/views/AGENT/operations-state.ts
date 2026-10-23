/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 证据请求范围与显示保护。 Scope and presentation guards for evidence requests.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
export const ORGANIZATION_SCOPE_KEY = 'synapxnet:organization-scope';
export const ORGANIZATION_SCOPE_EVENT = 'synapxnet:organization-scope-changed';

/** 提取组织范围，不把浏览器字段视作授权。 Reads organization scope without treating browser fields as authorization. */
export function readScopeKey(): string {
  try {
    const raw = globalThis.sessionStorage?.getItem(ORGANIZATION_SCOPE_KEY);
    const scope = raw ? JSON.parse(raw) : null;
    return scope?.tenantUid && scope?.deptUid && scope?.teamUid
      ? `${scope.tenantUid}/${scope.deptUid}/${scope.teamUid}`
      : '';
  } catch {
    return '';
  }
}

/** 为每轮请求保留序号和范围，旧请求永远不能覆盖新范围。 Guards request generations so stale responses cannot overwrite a new scope. */
export function createRequestGuard() {
  let revision = 0;
  return {
    /** 开始新一轮并使旧轮失效。 Starts a new generation and invalidates older requests. */
    begin(scope: string) {
      return { revision: ++revision, scope };
    },
    /** 显式使所有在途请求失效。 Invalidates all pending requests explicitly. */
    invalidate() {
      revision += 1;
    },
    /** 同时匹配序号和当前范围。 Matches both the generation and current organization scope. */
    accepts(ticket: { revision: number; scope: string }, scope: string) {
      return (
        ticket.revision === revision && ticket.scope === scope && Boolean(scope)
      );
    },
  };
}

/** 保持真实零值且对缺失或非数值显示未采集。 Preserves real zero values and labels missing or invalid samples. */
export function metricText(value: unknown, unit: string, digits = 2): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('zh-CN', { maximumFractionDigits: digits })} ${unit}`
    : '未采集';
}

/** 提取服务端公开错误，避免展示错误对象或技术堆栈。 Extracts a public server error without rendering objects or stack traces. */
export function evidenceError(error: unknown): string {
  const candidate = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  const data = candidate?.response?.data;
  const message =
    data?.error?.message ||
    data?.message ||
    '';
  // 旧服务未加载运行保障控制器时会把接口当作静态资源；转成可行动的产品提示，不暴露 Spring 技术文本。
  // Older services may route the endpoint to the static-resource handler; map that technical response to an actionable product message.
  if (/no static resource|internal server error/i.test(message)) {
    return '运行保障服务尚未完成升级，请联系管理员更新 AIOps 服务后重试。';
  }
  return message || '此来源暂时无法读取，请稍后重试或检查接入配置。';
}
