import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:server',
      order: 2,
      title: '集群管理',
    },
    name: 'CLM',
    path: '/CLM',
    children: [
      {
        name: 'ClusterList',
        path: '/CLM/cluster/list',
        component: () => import('#/views/CLM/cluster/list.vue'),
        meta: {
          icon: 'lucide:database',
          title: '集群列表',
        },
      },
      {
        name: 'ClusterCreate',
        path: '/CLM/cluster/create',
        component: () => import('#/views/CLM/cluster/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建集群',
        },
      },
      {
        name: 'ClusterDetail',
        path: '/CLM/cluster/detail/:id',
        component: () => import('#/views/CLM/cluster/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '集群详情',
        },
      },
      // ==================== MySQL ====================
      {
        name: 'MySQLList',
        path: '/CLM/mysql/list',
        component: () => import('#/views/CLM/mysql/list.vue'),
        meta: {
          icon: 'lucide:database',
          title: 'MySQL 部署',
        },
      },
      {
        name: 'MySQLDeploy',
        path: '/CLM/mysql/deploy',
        component: () => import('#/views/CLM/mysql/deploy.vue'),
        meta: {
          hideInMenu: true,
          title: '部署MySQL实例',
        },
      },
      // ==================== Redis ====================
      {
        name: 'RedisList',
        path: '/CLM/redis/list',
        component: () => import('#/views/CLM/redis/list.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: 'Redis 部署',
        },
      },
      {
        name: 'RedisDeploy',
        path: '/CLM/redis/deploy',
        component: () => import('#/views/CLM/redis/deploy.vue'),
        meta: {
          hideInMenu: true,
          title: '部署Redis实例',
        },
      },
      // ==================== Hadoop ====================
      {
        name: 'HadoopList',
        path: '/CLM/hadoop/list',
        component: () => import('#/views/CLM/hadoop/list.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: 'Hadoop 部署',
        },
      },
      {
        name: 'HadoopDeploy',
        path: '/CLM/hadoop/deploy',
        component: () => import('#/views/CLM/hadoop/deploy.vue'),
        meta: {
          hideInMenu: true,
          title: '部署Hadoop节点',
        },
      },
      // ==================== Jenkins ====================
      {
        name: 'JenkinsList',
        path: '/CLM/jenkins/list',
        component: () => import('#/views/CLM/jenkins/list.vue'),
        meta: {
          icon: 'lucide:settings',
          title: 'Jenkins 部署',
        },
      },
      {
        name: 'JenkinsDeploy',
        path: '/CLM/jenkins/deploy',
        component: () => import('#/views/CLM/jenkins/deploy.vue'),
        meta: {
          hideInMenu: true,
          title: '部署Jenkins',
        },
      },
    ],
  },
];


export default routes;

