import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 4,
      title: '服务管理',
    },
    name: 'SVM',
    path: '/SVM',
    children: [
      {
        name: 'ServiceList',
        path: '/SVM/service/list',
        component: () => import('#/views/SVM/service/list.vue'),
        meta: {
          icon: 'lucide:layers',
          title: '服务总览',
        },
      },
      {
        name: 'CommandList',
        path: '/SVM/command/list',
        component: () => import('#/views/SVM/command/list.vue'),
        meta: {
          icon: 'lucide:terminal',
          title: '指令中心',
        },
      },
      {
        name: 'FrameworkList',
        path: '/SVM/framework/list',
        component: () => import('#/views/SVM/framework/list.vue'),
        meta: {
          icon: 'lucide:package',
          title: '框架管理',
        },
      },
      {
        name: 'ServiceDetail',
        path: '/SVM/service/detail/:id',
        component: () => import('#/views/SVM/service/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '服务详情',
        },
      },
      {
        name: 'ServiceCreate',
        path: '/SVM/service/create',
        component: () => import('#/views/SVM/service/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建服务',
        },
      },
    ],
  },
];

export default routes;
