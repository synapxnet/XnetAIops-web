/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
 * 前后端路径契约审计 / Frontend-backend route contract audit.
 * Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const backend = path.resolve(root, '../backend');
const mappings = [];
const calls = [];
/** 遍历源文件而不进入构建或依赖目录。 Walk sources without build or dependency directories. */
async function files(directory, extension) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'target', 'dist', '.git'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(file, extension));
    else if (entry.name.endsWith(extension)) result.push(file);
  }
  return result;
}
for (const file of await files(backend, '.java')) {
  if (!file.includes(`${path.sep}main${path.sep}`)) continue;
  const text = await readFile(file, 'utf8');
  if (!/@(?:RestController|Controller)\b/.test(text)) continue;
  const prefix = text.split(/\bclass\s/)[0].match(/@RequestMapping\(\s*(?:value\s*=\s*)?"([^"]+)"/)?.[1] ?? '';
  for (const match of text.matchAll(/@(Get|Post|Put|Delete|Patch)Mapping(?:\(([^)]*)\))?/g)) {
    const suffix = match[2]?.match(/"([^"]*)"/)?.[1] ?? '';
    mappings.push({ method: match[1].toUpperCase(), path: prefix + suffix, source: path.relative(backend, file).replaceAll('\\', '/') });
  }
}
for (const file of await files(path.join(root, 'apps/web-antd/src'), '.ts')) {
  if (file.endsWith('.test.ts')) continue;
  const ast = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const definitions = new Map();
  /** 建立当前模块常量表以解析组合前缀。 Index local constants used to compose API paths. */
  function define(node) {
    if (ts.isVariableDeclaration(node) && node.initializer) definitions.set(node.name.getText(), node.initializer);
    ts.forEachChild(node, define);
  }
  define(ast);
  /** 展开静态路径，保留动态参数占位符。 Expand static prefixes while retaining dynamic parameter placeholders. */
  function value(node, seen = new Set()) {
    if (!node) return '?';
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((span) => value(span.expression, seen) + span.literal.text).join('');
    if (ts.isParenthesizedExpression(node)) return value(node.expression, seen);
    if (ts.isArrowFunction(node)) return value(node.body, seen);
    if (ts.isIdentifier(node) && definitions.has(node.text) && !seen.has(node.text)) return value(definitions.get(node.text), new Set([...seen, node.text]));
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && definitions.has(node.expression.text)) return value(definitions.get(node.expression.text), seen);
    return '{' + node.getText().replaceAll(/[{}]/g, '') + '}';
  }
  /** 记录每个原生客户端调用并保留调用函数。 Record native client calls and their owning functions. */
  function collect(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const client = node.expression.expression.getText();
      const method = node.expression.name.text.toUpperCase();
      const module = client === 'requestClient' || client === 'baseRequestClient' ? 'usr' : client.match(/^(\w+)RequestClient$/)?.[1];
      if (module && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        let owner = node.parent;
        while (owner && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
        const endpoint = '/api/' + module + value(node.arguments[0]);
        const shape = endpoint.split('?')[0].replaceAll(/\{[^}]+\}/g, '{}');
        const matches = mappings.filter((m) => m.method === method && m.path.replaceAll(/\{[^}]+\}/g, '{}') === shape);
        calls.push({ file: path.relative(root, file).replaceAll('\\', '/'), function: owner?.name?.text ?? '(module callback)', method, path: endpoint, backend: matches.map((m) => m.source), matched: matches.length > 0 });
      }
    }
    ts.forEachChild(node, collect);
  }
  collect(ast);
}
const missing = calls.filter((call) => !call.matched);
const optionalTemplates = missing.filter((call) => call.path === '/api/usr/menu/all' && call.file === 'apps/web-antd/src/api/core/menu.ts');
const unexpected = missing.filter((call) => !optionalTemplates.includes(call));
const metadata = { copyright: 'Copyright (C) 2026 Synapxnet. All rights reserved.', confidentiality: 'Proprietary and Confidential', author: 'maoyo', department: '研发部', date: '2026-10-23', version: '1.3.0', securityLevel: 'INTERNAL' };
await writeFile(path.join(root, 'tests/full-ui/api-contract-results.json'), JSON.stringify({ metadata, scope: 'Static native RequestClient method/path correspondence; resident service is separately deployed. The default frontend menu mode does not call the optional Vben backend-menu template.', total: calls.length, matched: calls.length - missing.length, optionalTemplates, unexpected, calls }, null, 2) + '\n');
console.log(JSON.stringify({ total: calls.length, matched: calls.length - missing.length, optionalTemplates, unexpected }, null, 2));
if (unexpected.length) process.exitCode = 1;
