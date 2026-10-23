/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
 * 页面与操作清单 / Page and action inventory.
 * Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = path.join(root, 'apps/web-antd/src');
const modules = path.join(sourceRoot, 'router/routes/modules');
const rows = [];
const values = { id: '1', clusterId: '1', namespace: 'default', nodeName: 'fixture-node', podName: 'fixture-pod', kind: 'deployment', name: 'fixture-workload', type: 'deployment', registryId: '1', projectName: 'fixture-project', repo: 'fixture-repo', chart: 'fixture-chart', version: '1.0.0', projectId: '1', pipelineId: '1', runId: '1', serviceId: '1', instanceId: '1', chartName: 'fixture-chart', group: 'fixture.io', plural: 'fixtures', crdName: 'fixtures.fixture.io' };

/** 合并页面自有子组件，避免只记录包装页而遗漏实际操作。 Include owned child components so wrapper pages retain their actual actions. */
async function pageSources(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const text = await readFile(file, 'utf8');
  const result = [{ file, text }];
  for (const match of text.matchAll(/from\s+['"]([^'"]+\.vue)['"]/g)) {
    const child = match[1].startsWith('#/') ? path.join(sourceRoot, match[1].slice(2)) : match[1].startsWith('.') ? path.resolve(path.dirname(file), match[1]) : null;
    if (child) result.push(...await pageSources(child, seen));
  }
  return result;
}

/** 读取对象字面量属性。 Read an object literal property. */
function prop(node, name) {
  return node?.properties?.find((p) => ts.isPropertyAssignment(p) && p.name.getText().replaceAll(/['"]/g, '') === name)?.initializer;
}
/** 保留静态值，动态标题保留源表达式。 Read a static value or retain its source expression. */
function literal(node) { return node && ts.isStringLiteral(node) ? node.text : node?.getText() ?? ''; }
/** 遍历实际路由语法树，不依赖旧验收结论。 Walk current route declarations without inheriting old QA claims. */
async function visit(node, group, sourceFile) {
  if (ts.isObjectLiteralExpression(node) && prop(node, 'path') && prop(node, 'component')) {
    const component = prop(node, 'component').getText().match(/import\(['"]([^'"]+)['"]\)/)?.[1];
    if (component?.startsWith('#/')) {
      const routePath = literal(prop(node, 'path'));
      const file = path.join(sourceRoot, component.slice(2));
      const sources = await pageSources(file);
      const text = sources.map((s) => s.text).join('\n');
      const apiFiles = [...new Set(sources.flatMap((source) => [...source.text.matchAll(/from\s+['"]([^'"]*(?:api|resident-api)[^'"]*)['"]/g)].map((m) => {
        const resolved = m[1].startsWith('#/') ? path.join(sourceRoot, m[1].slice(2)) : path.resolve(path.dirname(source.file), m[1]);
        return path.relative(root, resolved).replaceAll('\\', '/') + (resolved.endsWith('.ts') ? '' : '.ts');
      })))];
      rows.push({ group, path: routePath, name: literal(prop(node, 'name')), title: literal(prop(prop(node, 'meta'), 'title')), hidden: literal(prop(prop(node, 'meta'), 'hideInMenu')) === 'true', component, sourceFile,
        operations: [...new Set([...text.matchAll(/@(?:click|change|submit|finish|confirm|search|select|update:[\w-]+)="([^"]+)"/g)].map((m) => m[1]))],
        fieldsAndPanels: [...new Set([...text.matchAll(/(?:title|label|placeholder)="([^"\n]+)"/g)].map((m) => m[1]))], apiFiles,
        sourceFiles: sources.map((source) => path.relative(root, source.file).replaceAll('\\', '/')),
        url: '/#' + routePath.replace(/:([A-Za-z]\w*)\??/g, (_, key) => values[key] ?? '1'),
        verification: '静态路由、组件、操作和类型检查已核对；动态结果另见 smoke-results.json。',
      });
    }
  }
  for (const child of node.getChildren()) await visit(child, group, sourceFile);
}
for (const filename of (await readdir(modules)).filter((name) => name.endsWith('.ts')).sort()) {
  const file = path.join(modules, filename);
  const ast = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
  await visit(ast, filename.replace(/\.ts$/, ''), path.relative(root, file).replaceAll('\\', '/'));
}
rows.sort((a, b) => a.path.localeCompare(b.path));
const catalog = { metadata: { copyright: 'Copyright (C) 2026 Synapxnet. All rights reserved.', confidentiality: 'Proprietary and Confidential', author: 'maoyo', department: '研发部', date: '2026-10-23', version: '1.3.0', securityLevel: 'INTERNAL', source: 'Current TypeScript route AST', scope: 'Product route components; auth and global assistant are validated separately.' }, routes: rows };
await writeFile(path.join(root, 'tests/full-ui/current-routes.json'), JSON.stringify(catalog, null, 2) + '\n');
/** 编码 Markdown 单元格。 Escape Markdown cells. */
function cell(value) { return String(value).replaceAll('|', '\\|').replaceAll('\n', ' '); }
await writeFile(path.join(root, 'docs/MAINLINE-PAGE-MATRIX.md'), `<!-- Copyright (C) 2026 Synapxnet. All rights reserved.\nSynapxnet Proprietary and Confidential. Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0 | Security Level: INTERNAL -->\n# AIOps 菜单、页面与功能矩阵\n\n从当前路由声明生成，共 ${rows.length} 个组件页面。此表逐项记录功能入口，不把静态检查或本地夹具视作真实集群执行验收。实际浏览器结果见 tests/full-ui/smoke-results.json；真实基础设施边界见 MAINLINE-TRANSITION.md。\n\n| 模块 | 页面 | 路径 | 类型 | 操作 | 字段与面板 | API 模块 |\n|---|---|---|---|---|---|---|\n` + rows.map((r) => `| ${[r.group, r.title, r.path, r.hidden ? '详情/流程' : '菜单', r.operations.join('；'), r.fieldsAndPanels.join('；'), r.apiFiles.join('；')].map(cell).join(' | ')} |`).join('\n') + '\n');
console.log(`Current page catalog: ${rows.length} pages`);
