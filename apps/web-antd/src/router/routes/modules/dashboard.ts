import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: 1,
      title: '3D 总览',
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'DashboardOverview',
        path: '/dashboard/overview',
        component: () => import('#/views/dashboard/overview.vue'),
        meta: {
          icon: 'lucide:box',
          title: '集群3D视图',
        },
      },
    ],
  },
];

export default routes;
