import type { RouteRecordRaw } from 'vue-router';

import { IFrameView } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:panels-top-left',
      order: 9998,
      title: 'SynapXnet 项目',
    },
    name: 'SynapXnetProject',
    path: '/synapxnet',
    children: [
      {
        name: 'OpenXnet',
        path: '/synapxnet/openxnet',
        component: IFrameView,
        meta: {
          icon: 'lucide:book-open-text',
          link: 'https://openxnet.synapxnet.com',
          title: 'OpenXnet 开源社区',
        },
      },
      {
        name: 'XnetAIopsWebRepository',
        path: '/synapxnet/frontend',
        component: IFrameView,
        meta: {
          icon: 'mdi:github',
          link: 'https://github.com/synapxnet/XnetAIops-web',
          title: '前端仓库',
        },
      },
      {
        name: 'XnetAIopsRepository',
        path: '/synapxnet/backend',
        component: IFrameView,
        meta: {
          icon: 'mdi:github',
          link: 'https://github.com/synapxnet/XnetAIops',
          title: '后端仓库',
        },
      },
    ],
  },
  {
    name: 'SynapXnetAbout',
    path: '/about',
    component: () => import('#/views/_core/about/index.vue'),
    meta: {
      icon: 'lucide:badge-info',
      order: 9999,
      title: '关于 XnetAIops',
    },
  },
];

export default routes;
