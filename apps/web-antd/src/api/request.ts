/**
 * XnetAIops 请求客户端配置
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore, useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';
import { normalizeRequestFailure } from './public-error';
import { publishPageRequest } from '../design/request-state';

const {
  apiURL,
  clmApiURL,
  homApiURL,
  svmApiURL,
  monApiURL,
  k8sApiURL,
  regApiURL,
} = useAppConfig(import.meta.env, import.meta.env.PROD);

const ORGANIZATION_SCOPE_KEY = 'synapxnet:organization-scope';

interface OrganizationScope {
  deptUid: null | string;
  teamUid: null | string;
  tenantUid: null | string;
}

/** 读取当前页签内的组织范围，解析失败时按未授权处理。 */
function readOrganizationScope(): null | OrganizationScope {
  try {
    const raw = globalThis.sessionStorage?.getItem(ORGANIZATION_SCOPE_KEY);
    return raw ? (JSON.parse(raw) as OrganizationScope) : null;
  } catch {
    return null;
  }
}

/** 将已选租户、部门和团队写入业务请求头，供服务端二次校验。 */
function appendOrganizationScopeHeaders(headers: Record<string, any>) {
  const scope = readOrganizationScope();
  if (!scope?.tenantUid || !scope.deptUid || !scope.teamUid) return;
  headers['X-Tenant-Uid'] = scope.tenantUid;
  headers['X-Dept-Uid'] = scope.deptUid;
  headers['X-Team-Uid'] = scope.teamUid;
}


/** 建立原生业务客户端并记录页面请求边界。Create a native business client with page-scoped request boundaries. */
function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    timeout: 600_000,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const authStore = useAuthStore();
    await authStore.forceLogout();
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    useAuthStore().startSessionExpirationMonitor();
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      // 捕获发起页面，迟到错误不会污染新路由。Capture the source page so late errors cannot affect a new route.
      (config as any).__aiopsRoute = window.location.hash.startsWith('#/')
        ? window.location.hash.slice(1)
        : window.location.pathname + window.location.search;
      (config as any).__aiopsRequestKey = [
        config.method,
        config.baseURL,
        config.url,
      ].join(':');
      const accessStore = useAccessStore();
      const userStore = useUserStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      if (userStore.userInfo?.userId) {
        config.headers['X-User-Id'] = userStore.userInfo.userId;
      }
      appendOrganizationScopeHeaders(config.headers);
      return config;
    },
  });

  // 只有相同接口重试成功才移除其错误，不掩盖其他失败。Clear only the retried API error on success without hiding other failures.
  client.addResponseInterceptor({
    fulfilled: (response) => {
      const context = response.config as typeof response.config & {
        __aiopsRoute: string;
        __aiopsRequestKey: string;
      };
      if (response.data?.code === 0)
        publishPageRequest({
          route: context.__aiopsRoute,
          requestKey: context.__aiopsRequestKey,
          failed: false,
          message: '',
        });
      return response;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const visibleMessage = normalizeRequestFailure(error, msg);
      const inlineEvidence = /\/operations-workspace(?:\/|$)/.test(error?.config?.url ?? '');
      if (!inlineEvidence) publishPageRequest({
        route:
          error?.config?.__aiopsRoute ||
          (window.location.hash.startsWith('#/')
            ? window.location.hash.slice(1)
            : window.location.pathname + window.location.search),
        requestKey: error?.config?.__aiopsRequestKey || 'unknown',
        failed: true,
        message: visibleMessage,
      });
      // 登录页没有业务状态容器，由请求层提供单条反馈。 / Authentication pages have no business status container.
      if (window.location.hash.includes('/auth/')) message.error({ content: visibleMessage, key: 'request-error' });
    }),
  );

  return client;
}

/**
 * 创建不拆解 ToolResponse 包络的 Agent 请求客户端。
 *
 * @param serviceBaseURL 领域服务原有 API 地址
 * @returns 保留公共证据元数据和结构化错误的请求客户端
 */
function createAgentRequestClient(serviceBaseURL: string) {
  const baseURL = serviceBaseURL.replace(/\/api\/[^/]+\/?$/, '');
  const client = new RequestClient({
    baseURL,
    responseReturn: 'data',
    timeout: 60_000,
  });
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      config.headers.Authorization = formatAgentToken(
        useAccessStore().accessToken,
      );
      config.headers['Accept-Language'] = preferences.app.locale;
      appendOrganizationScopeHeaders(config.headers);
      return config;
    },
  });
  return client;
}

/** 将当前会话令牌格式化为 Bearer Header，不把令牌写入 URL。 */
function formatAgentToken(token: null | string) {
  return token ? `Bearer ${token}` : null;
}

// USR接口请求客户端 (用户认证，默认)
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

// CLM接口请求客户端 (集群管理)
export const clmRequestClient = createRequestClient(clmApiURL, {
  responseReturn: 'data',
});

// HOM接口请求客户端 (主机管理)
export const homRequestClient = createRequestClient(homApiURL, {
  responseReturn: 'data',
});

// SVM接口请求客户端 (服务管理)
export const svmRequestClient = createRequestClient(svmApiURL, {
  responseReturn: 'data',
});

// MON接口请求客户端 (监控告警)
export const monRequestClient = createRequestClient(monApiURL, {
  responseReturn: 'data',
});

// K8S接口请求客户端 (Kubernetes管理)
export const k8sRequestClient = createRequestClient(k8sApiURL, {
  responseReturn: 'data',
});

// REG接口请求客户端 (仓库管理)
export const regRequestClient = createRequestClient(regApiURL, {
  responseReturn: 'data',
});

export const agentMonRequestClient = createAgentRequestClient(monApiURL);
export const agentK8sRequestClient = createAgentRequestClient(k8sApiURL);
export const agentSvmRequestClient = createAgentRequestClient(svmApiURL);

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
