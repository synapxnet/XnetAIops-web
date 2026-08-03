import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    children: [
      {
        component: () => import('#/views/AGENT/incident/detail.vue'),
        meta: { hideInMenu: true, title: '事件证据' },
        name: 'AgentIncidentDetail',
        path: '/agent/incidents/:incidentId',
      },
    ],
    meta: { hideInMenu: true, title: 'Agent Trace' },
    name: 'AgentTrace',
    path: '/agent',
  },
];

export default routes;
