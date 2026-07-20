import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:warehouse',
      order: 8,
      title: '仓库管理',
    },
    name: 'REG',
    path: '/REG',
    children: [
      {
        name: 'RegistryList',
        path: '/REG/registry/list',
        component: () => import('#/views/REG/registry/list.vue'),
        meta: {
          icon: 'lucide:database',
          title: '仓库总览',
        },
      },
      {
        name: 'RegistryCreate',
        path: '/REG/registry/create',
        component: () => import('#/views/REG/registry/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建仓库',
        },
      },
      {
        name: 'RegistryDetail',
        path: '/REG/registry/detail/:id',
        component: () => import('#/views/REG/registry/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '仓库详情',
        },
      },
      {
        name: 'DeployLogs',
        path: '/REG/deploy/logs',
        component: () => import('#/views/REG/deploy/logs.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '部署日志',
        },
      },
    ],
  },
];

export default routes;
