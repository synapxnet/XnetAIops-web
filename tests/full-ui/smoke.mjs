/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
 * 本地生产构建逐页验收 / Page-level checks of the local production build.
 * Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:5294';
const { routes } = JSON.parse(await readFile(new URL('./current-routes.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const blockedExternal = new Set();
// 页面测试完全隔离外网。 Keep all UI verification isolated from external services.
await context.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
  blockedExternal.add(url.origin);
  return route.abort();
});
const page = await context.newPage();
let pageErrors = [];
let requests = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('response', (response) => {
  if (response.url().includes('/api/')) requests.push({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status() });
});
const results = [];
try {
  await page.goto(origin + '/#/auth/login');
  await page.getByPlaceholder('手机号码', { exact: true }).fill('19900000001');
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  for (let index = 0; index < 6; index++) await page.getByRole('textbox', { name: `pin input ${index + 1} of 6`, exact: true }).fill(String(index + 1));
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL('**/#/CLM/cluster/list');
  await page.getByText('界面样本 · 研发算力集群', { exact: true }).waitFor();
  const auth = { passed: requests.some((r) => r.path === '/api/usr/sms-code' && r.status === 200) && requests.some((r) => r.path === '/api/usr/login' && r.status === 200), pageErrors: [...pageErrors] };
  for (const mode of ['samples', 'empty', 'error']) {
    await context.request.post(origin + '/__qa/state', { data: { mode } });
    for (const route of routes) {
      pageErrors = [];
      requests = [];
      await page.goto(origin + route.url);
      await page.reload();
      await page.getByRole('button', { name: '打开驻场 Agent', exact: true }).waitFor({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const text = await page.locator('body').innerText();
      const url = page.url();
      const rendered = !url.includes('/auth/') && !text.includes('抱歉，您访问的页面不存在') && text.length > 180;
      results.push({ path: route.path, title: route.title, mode, rendered, pageErrors: [...pageErrors], requests: [...requests], headingCount: await page.locator('h1,h2,h3').count(), buttons: await page.locator('button:visible').allTextContents() });
      if (!rendered || pageErrors.length) console.log(JSON.stringify({ path: route.path, mode, rendered, errors: pageErrors }));
    }
    console.log(`${mode}: ${routes.length} pages visited`);
  }
  const report = { metadata: { copyright: 'Copyright (C) 2026 Synapxnet. All rights reserved.', confidentiality: 'Proprietary and Confidential', author: 'maoyo', department: '研发部', date: '2026-10-23', version: '1.3.0', securityLevel: 'INTERNAL' }, date: '2026-10-23', environment: 'Local production build + explicitly synthetic UI fixtures; no live infrastructure or model requests', auth, blockedExternalOrigins: [...blockedExternal], routes: routes.length, checks: results.length, results };
  await writeFile(new URL('./smoke-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  const failures = results.filter((r) => !r.rendered || r.pageErrors.length);
  console.log(`Browser checks ${results.length}; rendering/runtime failures ${failures.length}; local login ${auth.passed}`);
  if (failures.length || !auth.passed || auth.pageErrors.length) process.exitCode = 1;
} finally {
  await context.request.post(origin + '/__qa/state', { data: { mode: 'samples' } });
  await browser.close();
}
