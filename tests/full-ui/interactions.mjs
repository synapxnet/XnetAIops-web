/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
 * 本地交互回归 / Local interaction regression.
 * Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const origin = 'http://127.0.0.1:5294';
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
// 写操作只允许进入本机专用夹具。 All mutations are restricted to the dedicated local fixture.
await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const checks = [];
try {
  await context.request.post(origin + '/__qa/state', { data: { mode: 'samples' } });
  await page.goto(origin + '/#/auth/login');
  await page.getByPlaceholder('手机号码', { exact: true }).fill('19900000001');
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  for (let index = 0; index < 6; index++) await page.getByRole('textbox', { name: `pin input ${index + 1} of 6`, exact: true }).fill(String(index + 1));
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL('**/#/CLM/cluster/list');
  await page.getByRole('button', { name: '创建集群', exact: true }).click();
  await page.getByRole('button', { name: /^创\s*建$/ }).click();
  await page.getByText('请填写集群名称和编码', { exact: true }).waitFor();
  checks.push('空表单提交被阻止');
  const name = '本地交互回归集群';
  await page.getByPlaceholder('请输入集群名称', { exact: true }).fill(name);
  await page.getByPlaceholder('请输入集群编码（唯一标识）', { exact: true }).fill('local-interaction-test');
  await context.request.post(origin + '/__qa/state', { data: { mode: 'error' } });
  const failed = page.waitForResponse((r) => r.url().endsWith('/api/clm/clusters') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /^创\s*建$/ }).click();
  assert.equal((await failed).status(), 503);
  assert.equal(await page.getByPlaceholder('请输入集群名称', { exact: true }).inputValue(), name);
  checks.push('服务失败保留表单并可重试');
  await context.request.post(origin + '/__qa/state', { data: { mode: 'samples' } });
  await page.getByRole('button', { name: /^创\s*建$/ }).click();
  await page.waitForURL('**/#/CLM/cluster/list');
  const row = page.getByRole('row').filter({ hasText: name });
  await row.waitFor();
  checks.push('创建回执后列表显示新记录');
  await row.getByRole('button', { name: /^删\s*除$/ }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: /^取\s*消$/ }).click();
  await row.waitFor();
  checks.push('删除取消保留记录');
  await row.getByRole('button', { name: /^删\s*除$/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^确\s*定$/ }).click();
  await row.waitFor({ state: 'detached' });
  checks.push('确认删除后记录从列表移除');
  await page.getByRole('button', { name: '打开驻场 Agent', exact: true }).click();
  const resident = page.locator('.resident-shell');
  await resident.waitFor({ state: 'visible' });
  await resident.getByRole('button', { name: '能力库 ↗', exact: true }).waitFor();
  checks.push('驻场面板仍可从全局入口打开');
  assert.deepEqual(errors, []);
  await writeFile(new URL('./interaction-results.json', import.meta.url), JSON.stringify({ metadata: { copyright: 'Copyright (C) 2026 Synapxnet. All rights reserved.', author: 'maoyo', date: '2026-10-23', version: '1.3.0', securityLevel: 'INTERNAL' }, environment: 'Local explicit UI fixture, not live deployment', checks, pageErrors: errors }, null, 2) + '\n');
  console.log(`${checks.length} local interaction checks passed`);
} finally {
  await context.request.post(origin + '/__qa/state', { data: { mode: 'samples' } });
  await browser.close();
}
