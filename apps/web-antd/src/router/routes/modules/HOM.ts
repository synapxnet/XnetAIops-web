import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:monitor',
      order: 3,
      title: '主机管理',
    },
    name: 'HOM',
    path: '/HOM',
    children: [
      {
        name: 'HostList',
        path: '/HOM/host/list',
        component: () => import('#/views/HOM/host/list.vue'),
        meta: {
          icon: 'lucide:pc-case',
          title: '主机列表',
        },
      },
      {
        name: 'HostAdd',
        path: '/HOM/host/add',
        component: () => import('#/views/HOM/host/add.vue'),
        meta: {
          hideInMenu: true,
          title: '添加主机',
        },
      },
      {
        name: 'HostDetail',
        path: '/HOM/host/detail/:id',
        component: () => import('#/views/HOM/host/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '主机详情',
        },
      },
      {
        name: 'RackList',
        path: '/HOM/rack/list',
        component: () => import('#/views/HOM/rack/list.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: '机架管理',
        },
      },
    ],
  },
];

export default routes;
