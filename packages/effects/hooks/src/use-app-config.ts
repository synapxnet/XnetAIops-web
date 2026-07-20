import type {
  ApplicationConfig,
  VbenAdminProAppConfigRaw,
} from '@vben/types/global';

/**
 * 由 vite-inject-app-config 注入的全局配置
 */
export function useAppConfig(
  env: Record<string, any>,
  isProduction: boolean,
): ApplicationConfig {
  // 生产环境下，直接使用 window._VBEN_ADMIN_PRO_APP_CONF_ 全局变量
  const config = isProduction
    ? { ...env, ...window._VBEN_ADMIN_PRO_APP_CONF_ }
    : (env as VbenAdminProAppConfigRaw);

  const {
    VITE_GLOB_API_URL,
    VITE_CLM_API_URL,
    VITE_HOM_API_URL,
    VITE_SVM_API_URL,
    VITE_MON_API_URL,
    VITE_K8S_API_URL,
    VITE_REG_API_URL,
  } = config;

  return {
    apiURL: VITE_GLOB_API_URL,
    clmApiURL: VITE_CLM_API_URL,
    homApiURL: VITE_HOM_API_URL,
    svmApiURL: VITE_SVM_API_URL,
    monApiURL: VITE_MON_API_URL,
    k8sApiURL: VITE_K8S_API_URL,
    regApiURL: VITE_REG_API_URL,
  };
}
