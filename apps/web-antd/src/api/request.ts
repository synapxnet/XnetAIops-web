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

const {
  apiURL,
  clmApiURL,
  homApiURL,
  svmApiURL,
  monApiURL,
  k8sApiURL,
  regApiURL,
} = useAppConfig(import.meta.env, import.meta.env.PROD);

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
      const accessStore = useAccessStore();
      const userStore = useUserStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      if (userStore.userInfo?.userId) {
        config.headers['X-User-Id'] = userStore.userInfo.userId;
      }
      return config;
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
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
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

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
