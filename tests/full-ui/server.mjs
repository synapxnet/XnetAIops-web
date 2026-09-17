/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

/** 完整生产应用的本地夹具，永不连接线上。Local fixtures for the entire production application; never connects online. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { evidenceFixture } from './evidence-fixtures.mjs';
const base = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const dist = path.join(base, 'apps/web-antd/dist');
const catalog = JSON.parse(
  await readFile(new URL('./routes.json', import.meta.url), 'utf8'),
);
let mode = 'samples';
const requests = [];
const stamp = '2026-09-13T12:00:00Z';
const seed = {
  id: 1,
  uid: 'fixture-cluster-1',
  clusterName: '界面样本 · 研发算力集群',
  clusterCode: 'fixture-dev',
  clusterType: 'kubernetes',
  status: 'running',
  totalHosts: 0,
  runningServices: 0,
  createdBy: '本地测试身份',
  createdAt: stamp,
  updatedAt: stamp,
  description: '本地静态夹具，仅用于界面验收，不代表真实集群。',
};
let clmClusters = [{ ...seed }];
const k8sCluster = {
  id: 1,
  uid: 'fixture-k8s-1',
  name: '界面样本 · K8S集群',
  apiServerUrl: 'https://fixture.invalid',
  version: 'v1.30.0',
  nodeCount: 1,
  namespaceCount: 1,
  status: 'active',
  provider: 'local-fixture',
  createdAt: stamp,
  updatedAt: stamp,
};
const namespace = {
  name: 'default',
  status: 'Active',
  podCount: 1,
  deploymentCount: 0,
  serviceCount: 0,
  createdAt: stamp,
};
const node = {
  name: 'fixture-node',
  status: 'Ready',
  roles: ['worker'],
  hostname: 'fixture-node',
  internalIP: '192.0.2.1',
  cpuCapacity: '4',
  memoryCapacity: '8Gi',
  podCapacity: '110',
  osImage: '本地测试夹具',
  kubeletVersion: 'v1.30.0',
  labels: {},
  createdAt: stamp,
};
const pod = {
  name: 'fixture-pod',
  namespace: 'default',
  status: 'Running',
  phase: 'Running',
  nodeName: 'fixture-node',
  podIP: '192.0.2.2',
  hostIP: '192.0.2.1',
  ready: '1/1',
  readyCount: 1,
  totalContainers: 1,
  restarts: 0,
  images: ['fixture.invalid/ui-check:1'],
  containers: [
    {
      name: 'fixture-container',
      image: 'fixture.invalid/ui-check:1',
      ready: true,
      restartCount: 0,
      state: 'Running',
      isInit: false,
    },
  ],
  labels: {},
  annotations: {},
  createdAt: stamp,
};
const initContainer = {
  name: 'fixture-init',
  image: 'fixture.invalid/ui-init:1',
  isInit: true,
  ready: false,
  restartCount: 1,
  state: 'Terminated',
  terminatedReason: 'Completed',
  exitCode: 0,
};
const podPath = '/api/k8s/clusters/1/namespaces/default/pods/fixture-pod';
const user = {
  userId: 900001,
  id: 900001,
  username: 'local-ui-review',
  realName: '本地界面测试身份',
  userType: 'admin',
  roles: ['super', 'admin'],
  homePath: '/CLM/cluster/list',
  avatar: '',
  desc: '本地夹具',
};
const authToken = [
  Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url'),
  Buffer.from(
    JSON.stringify({
      sub: 'local-ui-review',
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  ).toString('base64url'),
  'local-fixture-only',
].join('.');
const listContracts = JSON.parse(
  await readFile(new URL('./list-contracts.json', import.meta.url), 'utf8'),
).contracts;
/** 发送原生包络并禁用缓存。Send native envelopes with caching disabled. */
function json(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(data));
}
/** 解析有界本地请求体。Parse bounded local request bodies. */
async function bodyOf(request) {
  let text = '';
  for await (const part of request) {
    text += part;
    if (text.length > 100000) throw new Error('request too large');
  }
  return text ? JSON.parse(text) : {};
}
/** 明确区分空态和样例。Separate empty and sample states explicitly. */
function list(value) {
  return mode === 'empty' ? [] : value;
}
/** 仅返回声明的读取契约。Return declared read contracts only. */
function readFixture(url) {
  const evidence = evidenceFixture(url, mode);
  if (evidence !== undefined) return { known: true, value: evidence };
  const values = {
    '/api/clm/clusters': list(clmClusters),
    '/api/clm/clusters/1':
      mode === 'empty' ? null : clmClusters.find((cluster) => cluster.id === 1),
    '/api/clm/clusters/1/variables': [],
    '/api/k8s/clusters': list([k8sCluster]),
    '/api/k8s/clusters/1': mode === 'empty' ? null : k8sCluster,
    '/api/k8s/clusters/1/namespaces': list([namespace]),
    '/api/k8s/clusters/1/namespaces/default':
      mode === 'empty' ? null : namespace,
    '/api/k8s/clusters/1/nodes': list([node]),
    '/api/k8s/clusters/1/nodes/fixture-node': mode === 'empty' ? null : node,
    '/api/k8s/clusters/1/pods': list([pod]),
    '/api/k8s/clusters/1/namespaces/default/pods': list([pod]),
    '/api/k8s/clusters/1/namespaces/default/pods/fixture-pod':
      mode === 'empty' ? null : pod,
    [podPath + '/containers']: list([...pod.containers, initContainer]),
    [podPath + '/events']: list([
      {
        namespace: 'default', name: 'fixture-pod', kind: 'Pod',
        type: 'Normal', reason: 'Started', count: 1,
        message: '本地测试事件：容器已启动（非真实集群）',
        lastTimestamp: stamp, source: 'local-fixture',
      },
    ]),
    [podPath + '/logs']: mode === 'empty' ? '' :
      '[local-fixture] fixture-container ready\n[local-fixture] UI verification only; no cluster connection.',
    '/api/hom/hosts': [],
    '/api/hom/racks': [],
    '/api/usr/users': list([
      { ...user, userPhone: '19900000001', status: 'active', createdAt: stamp },
    ]),
  };
  if (Object.hasOwn(values, url.pathname))
    return { known: true, value: values[url.pathname] ?? null };
  if (
    listContracts.some((contract) =>
      new RegExp(contract.pattern).test(url.pathname),
    )
  )
    return { known: true, value: [] };
  return { known: false };
}
/** 编码测试导航文字。Escape fixture navigation labels. */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
const banner =
  '<style>#full-ui-fixture{position:fixed;bottom:0;left:0;right:0;z-index:99999;display:flex;align-items:center;flex-wrap:wrap;gap:10px;background:#102d49;color:#f0f8ff;padding:8px 14px;font:12px/1.4 system-ui}#full-ui-fixture a{color:#a9e7ff}#full-ui-fixture button{padding:3px 7px;background:#204868;border:1px solid #7ba7c8;color:white;border-radius:4px}body{padding-bottom:42px!important}</style><aside id="full-ui-fixture" aria-label="本地测试环境"><strong>本地完整应用测试 · 非真实业务数据</strong><span id="fixture-mode">样例</span><a href="/__qa/routes">91页导航</a><button data-mode="samples">样例</button><button data-mode="empty">空态</button><button data-mode="error">失败</button><button data-mode="pod-events-error">事件失败</button><button data-mode="pod-logs-error">日志失败</button></aside><script src="/__qa/banner.js"></script>';
const bannerScript =
  "document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',async()=>{await fetch('/__qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:button.dataset.mode})});location.reload()}));fetch('/__qa/state').then(r=>r.json()).then(s=>document.querySelector('#fixture-mode').textContent={samples:'样例',empty:'空态',error:'失败','pod-events-error':'事件失败','pod-logs-error':'日志失败'}[s.mode]);";
/** 服务完整应用，身份和样例均局限本测试目录。Serve the complete app with fixture identity and data confined to this testing directory. */
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:5294');
  try {
    if (url.pathname === '/__qa/state') {
      if (request.method === 'POST') {
        const body = await bodyOf(request);
        if (!['samples', 'empty', 'error', 'pod-events-error', 'pod-logs-error'].includes(body.mode))
          return json(response, 400, { error: 'invalid mode' });
        mode = body.mode;
      }
      return json(response, 200, {
        mode,
        fixture: true,
        onlineConnection: false,
      });
    }
    if (url.pathname === '/__qa/routes.json')
      return json(response, 200, catalog);
    if (url.pathname === '/__qa/requests') return json(response, 200, requests);
    if (url.pathname === '/__qa/contracts')
      return json(response, 200, listContracts);
    if (url.pathname === '/__qa/banner.js') {
      response.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
      });
      return response.end(bannerScript);
    }
    if (url.pathname === '/__qa/routes') {
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return response.end(
        '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AIOps 全量页面验收导航</title><style>body{font:14px/1.7 system-ui;margin:24px;background:#f2f6fa;color:#173049}a{color:#166ca4}table{border-collapse:collapse;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #dce5ed}code{word-break:break-all}</style><h1>AIOps 本地完整应用 · 91页导航</h1><p>实际生产构建、登录、权限路由和业务组件。仅本机夹具；未知接口503，未定义写操作拒绝。</p><p>本地测试手机号：19900000001；验证码：123456。<a href="/#/auth/login">进入登录页</a> · <a href="/__qa/routes.json">机器可读路由</a></p><table><thead><tr><th>模块</th><th>页面</th><th>页面族</th><th>原路径</th></tr></thead><tbody>' +
          catalog.routes
            .map(
              (route) =>
                '<tr><td>' +
                escapeHtml(route.group) +
                '</td><td><a href="' +
                escapeHtml(route.url) +
                '">' +
                escapeHtml(route.title) +
                '</a></td><td>' +
                escapeHtml(route.family) +
                '</td><td><code>' +
                escapeHtml(route.path) +
                '</code></td></tr>',
            )
            .join('') +
          '</tbody></table></html>',
      );
    }
    if (url.pathname.startsWith('/api/')) {
      requests.push({ method: request.method, path: url.pathname, mode });
      if (requests.length > 500) requests.shift();
      const ok = (data) =>
        json(response, 200, { code: 0, message: '本地测试夹具', data });
      if (request.method === 'POST' && url.pathname === '/api/usr/login') {
        const body = await bodyOf(request);
        if (body.userPhone !== '19900000001' || body.code !== '123456')
          return json(response, 401, {
            code: 401,
            message: '本地夹具使用手机号19900000001和验证码123456',
            data: null,
          });
        return ok({
          accessToken: authToken,
          userId: user.userId,
          username: user.username,
          userType: 'admin',
        });
      }
      if (request.method === 'POST' && url.pathname === '/api/usr/logout')
        return ok(null);
      if (request.method === 'GET' && url.pathname === '/api/usr/user/info')
        return ok(user);
      if (request.method === 'GET' && url.pathname === '/api/usr/auth/codes')
        return ok(['*']);
      if (
        request.method === 'GET' &&
        url.pathname === '/api/usr/organization-tree'
      )
        return ok([
          {
            value: 'fixture-tenant',
            label: '本地测试租户',
            dataAccess: false,
            children: [
              {
                value: 'fixture-dept',
                label: '测试研发部门',
                dataAccess: false,
                children: [
                  {
                    value: 'fixture-team',
                    label: '界面验收团队',
                    dataAccess: true,
                  },
                ],
              },
            ],
          },
        ]);
      if (mode === 'error')
        return json(response, 503, {
          code: 503,
          message: '本地失败场景：业务服务暂时不可用，已填写内容应保留。',
          data: null,
        });
      if (request.method === 'GET' && (
        mode === 'pod-events-error' && url.pathname === podPath + '/events' ||
        mode === 'pod-logs-error' && url.pathname === podPath + '/logs'
      )) return json(response, 503, {
        code: 503,
        message: mode === 'pod-events-error' ? '本地测试：事件读取失败' : '本地测试：日志读取失败',
        data: null,
      });
      if (request.method === 'GET') {
        const result = readFixture(url);
        if (result.known) return ok(result.value);
      }
      if (request.method === 'POST' && url.pathname === '/api/clm/clusters') {
        const body = await bodyOf(request);
        if (!body.clusterName || !body.clusterCode || !body.clusterType)
          return json(response, 400, {
            code: 400,
            message: '测试契约：集群名称、编码和类型必填',
            data: null,
          });
        const cluster = {
          ...seed,
          ...body,
          id: Math.max(1, ...clmClusters.map((entry) => entry.id)) + 1,
          uid: 'fixture-created-' + Date.now(),
        };
        clmClusters.push(cluster);
        return ok(cluster);
      }
      if (
        request.method === 'DELETE' &&
        /^\/api\/clm\/clusters\/\d+$/.test(url.pathname)
      ) {
        const id = Number(url.pathname.split('/').at(-1));
        if (!clmClusters.some((cluster) => cluster.id === id))
          return json(response, 404, {
            code: 404,
            message: '测试记录不存在',
            data: null,
          });
        clmClusters = clmClusters.filter((cluster) => cluster.id !== id);
        return ok(null);
      }
      return json(response, 503, {
        code: 503,
        message:
          '本地验收未定义此接口夹具，未连接线上：' +
          request.method +
          ' ' +
          url.pathname,
        data: null,
      });
    }
    const filename = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
    if (!filename.startsWith(dist + path.sep) && filename !== dist)
      return json(response, 403, { error: 'invalid path' });
    let file = filename;
    try {
      if (!(await stat(file)).isFile()) file = path.join(dist, 'index.html');
    } catch {
      if (path.extname(filename))
        return json(response, 404, { error: 'asset missing' });
      file = path.join(dist, 'index.html');
    }
    const ext = path.extname(file);
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
      '.ico': 'image/x-icon',
    };
    let data = await readFile(file);
    if (ext === '.html')
      data = Buffer.from(
        data.toString().replace('</body>', banner + '</body>'),
      );
    response.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(data);
  } catch {
    json(response, 500, {
      code: 500,
      message: '本地夹具请求解析失败',
      data: null,
    });
  }
});
/** 拒绝终端升级，不创建任何真实终端连接。Reject terminal upgrades without opening any real terminal connections. */
server.on('upgrade', (_request, socket) =>
  socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n'),
);
/** 只监听本机回环地址。Listen on the local loopback address only. */
server.listen(5294, '127.0.0.1', () =>
  console.log(
    'AIOps full application fixture: http://127.0.0.1:5294/__qa/routes',
  ),
);
