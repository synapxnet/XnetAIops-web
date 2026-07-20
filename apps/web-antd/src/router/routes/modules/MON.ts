import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bell',
      order: 5,
      title: '监控告警',
    },
    name: 'MON',
    path: '/MON',
    children: [
      {
        name: 'MonDashboard',
        path: '/MON/dashboard',
        component: () => import('#/views/MON/dashboard.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '监控面板',
        },
      },
      {
        name: 'AlertList',
        path: '/MON/alert/list',
        component: () => import('#/views/MON/alert/list.vue'),
        meta: {
          icon: 'lucide:alert-triangle',
          title: '告警历史',
        },
      },
      {
        name: 'AlertRules',
        path: '/MON/alert/rules',
        component: () => import('#/views/MON/alert/rules.vue'),
        meta: {
          icon: 'lucide:shield',
          title: '告警规则',
        },
      },
    ],
  },
];

export default routes;
