/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 验证证据范围、缺失和错误显示。 Verifies evidence scope, missing values and error presentation.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import { describe, expect, it } from 'vitest';
import {
  createRequestGuard,
  evidenceError,
  metricText,
} from './operations-state';

// 同时覆盖组织切换、相同范围刷新和页面退出。 Covers organization changes, same-scope refreshes and leaving the page.
describe('operations evidence boundaries', () => {
  // 组织改变后，无论返回顺序如何都拒绝旧结果。 Rejects old results after an organization change regardless of response order.
  it('rejects another organization and previous request generations', () => {
    const guard = createRequestGuard();
    const first = guard.begin('tenant-a/dept-a/team-a');
    expect(guard.accepts(first, 'tenant-b/dept-b/team-b')).toBe(false);
    const second = guard.begin(first.scope);
    expect(guard.accepts(first, first.scope)).toBe(false);
    expect(guard.accepts(second, second.scope)).toBe(true);
    guard.invalidate();
    expect(guard.accepts(second, second.scope)).toBe(false);
  });
  // 缺少组织的请求不能展示结果。 Requests without organization scope cannot render results.
  it('fails closed when the organization scope is absent', () => {
    const guard = createRequestGuard();
    const ticket = guard.begin('');
    expect(guard.accepts(ticket, '')).toBe(false);
  });
  // 真实零值与未采集必须不同。 Real zero samples must remain distinct from missing samples.
  it('preserves zero and never invents missing metrics', () => {
    expect(metricText(0, 'cores')).toBe('0 cores');
    expect(metricText(null, 'cores')).toBe('未采集');
    expect(metricText(Number.NaN, 'cores')).toBe('未采集');
    expect(metricText('12', 'cores')).toBe('未采集');
  });
  // 两种错误包络都提取公开说明，普通异常不泄露堆栈。 Extracts public errors from either envelope without revealing ordinary exception stacks.
  it('shows structured errors and hides raw exception details', () => {
    expect(
      evidenceError({
        response: { data: { message: '尚未配置资源授权映射' } },
      }),
    ).toBe('尚未配置资源授权映射');
    expect(
      evidenceError({
        response: { data: { error: { message: '读取被拒绝' } } },
      }),
    ).toBe('读取被拒绝');
    expect(evidenceError(new Error('private database detail'))).not.toContain(
      'private',
    );
    expect(
      evidenceError({
        response: {
          data: {
            message:
              'Internal server error: No static resource api/mon/operations-workspace.',
          },
        },
      }),
    ).toBe('运行保障服务尚未完成升级，请联系管理员更新 AIOps 服务后重试。');
  });
});
