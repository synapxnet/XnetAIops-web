import type { RouteMeta as IRouteMeta } from '@vben-core/typings';

import 'vue-router';

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends IRouteMeta {}
}

export interface VbenAdminProAppConfigRaw {
  VITE_GLOB_API_URL: string;
  VITE_CLM_API_URL: string;
  VITE_HOM_API_URL: string;
  VITE_SVM_API_URL: string;
  VITE_MON_API_URL: string;
  VITE_K8S_API_URL: string;
  VITE_REG_API_URL: string;
}

export interface ApplicationConfig {
  apiURL: string;
  clmApiURL: string;
  homApiURL: string;
  svmApiURL: string;
  monApiURL: string;
  k8sApiURL: string;
  regApiURL: string;
}

declare global {
  interface Window {
    _VBEN_ADMIN_PRO_APP_CONF_: VbenAdminProAppConfigRaw;
  }
}
