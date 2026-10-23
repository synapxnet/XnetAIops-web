import { defineOverridesPreferences } from '@vben/preferences';

import logo from '../../../packages/effects/layouts/src/logo/Synap-Xnet.png';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    // 主线使用本地路由与服务端业务授权，不启用框架的后台菜单模板。 Mainline uses local routes and server-side business authorization, not the framework's backend-menu template.
    accessMode: 'frontend',
    defaultAvatar: logo,
    defaultHomePath: '/dashboard/overview',
    enableCheckUpdates: false,
    name: import.meta.env.VITE_APP_TITLE,
    preferencesButtonPosition: 'header',
  },
  breadcrumb: { enable: false },
  theme: { colorPrimary: '#187bbd', mode: 'light', radius: '0.75' },
  copyright: {
    companyName: 'SynapXnet',
    companySiteLink: 'https://openxnet.synapxnet.com',
    date: '2026',
    enable: true,
  },
  logo: {
    enable: true,
    source: logo,
  },
});
