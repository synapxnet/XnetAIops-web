import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:container',
      order: 3,
      title: 'K8S管理',
    },
    name: 'K8S',
    path: '/K8S',
    children: [
      // 集群管理
      {
        name: 'K8sClusterList',
        path: '/K8S/cluster/list',
        component: () => import('#/views/K8S/cluster/list.vue'),
        meta: {
          icon: 'lucide:server',
          title: '集群管理',
        },
      },
      {
        name: 'K8sClusterCreate',
        path: '/K8S/cluster/create',
        component: () => import('#/views/K8S/cluster/create.vue'),
        meta: {
          hideInMenu: true,
          title: '添加集群',
        },
      },
      {
        name: 'K8sClusterDetail',
        path: '/K8S/cluster/detail/:id',
        component: () => import('#/views/K8S/cluster/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '集群详情',
        },
      },
      // 节点管理
      {
        name: 'K8sNodeList',
        path: '/K8S/node/list',
        component: () => import('#/views/K8S/node/list.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: '节点管理',
        },
      },
      {
        name: 'K8sNodeDetail',
        path: '/K8S/node/detail/:clusterId/:nodeName',
        component: () => import('#/views/K8S/node/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '节点详情',
        },
      },
      // 命名空间
      {
        name: 'K8sNamespaceList',
        path: '/K8S/namespace/list',
        component: () => import('#/views/K8S/namespace/list.vue'),
        meta: {
          icon: 'lucide:folder-open',
          title: '命名空间',
        },
      },
      {
        name: 'K8sNamespaceCreate',
        path: '/K8S/namespace/create',
        component: () => import('#/views/K8S/namespace/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建命名空间',
        },
      },
      {
        name: 'K8sNamespaceDetail',
        path: '/K8S/namespace/detail/:clusterId/:namespace',
        component: () => import('#/views/K8S/namespace/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '命名空间详情',
        },
      },
      // 工作负载
      {
        name: 'K8sWorkloadList',
        path: '/K8S/workload/list',
        component: () => import('#/views/K8S/workload/list.vue'),
        meta: {
          icon: 'lucide:layers',
          title: '工作负载',
        },
      },
      {
        name: 'K8sWorkloadCreate',
        path: '/K8S/workload/create',
        component: () => import('#/views/K8S/workload/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建工作负载',
        },
      },
      {
        name: 'K8sWorkloadDetail',
        path: '/K8S/workload/detail/:clusterId/:namespace/:kind/:name',
        component: () => import('#/views/K8S/workload/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '工作负载详情',
        },
      },
      // 容器组
      {
        name: 'K8sPodList',
        path: '/K8S/pod/list',
        component: () => import('#/views/K8S/pod/list.vue'),
        meta: {
          icon: 'lucide:box',
          title: '容器组',
        },
      },
      {
        name: 'K8sPodDetail',
        path: '/K8S/pod/detail/:clusterId/:namespace/:podName',
        component: () => import('#/views/K8S/pod/detail.vue'),
        meta: {
          hideInMenu: true,
          title: 'Pod详情',
        },
      },
      // 任务
      {
        name: 'K8sJobList',
        path: '/K8S/job/list',
        component: () => import('#/views/K8S/job/list.vue'),
        meta: {
          icon: 'lucide:timer',
          title: '任务',
        },
      },
      {
        name: 'K8sJobDetail',
        path: '/K8S/job/detail/:clusterId/:namespace/:type/:name',
        component: () => import('#/views/K8S/job/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '任务详情',
        },
      },
      // 服务
      {
        name: 'K8sServiceList',
        path: '/K8S/service/list',
        component: () => import('#/views/K8S/service/list.vue'),
        meta: {
          icon: 'lucide:network',
          title: '服务',
        },
      },
      {
        name: 'K8sServiceCreate',
        path: '/K8S/service/create',
        component: () => import('#/views/K8S/service/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建服务',
        },
      },
      {
        name: 'K8sServiceDetail',
        path: '/K8S/service/detail/:clusterId/:namespace/:name',
        component: () => import('#/views/K8S/service/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '服务详情',
        },
      },
      // 路由 (Ingress)
      {
        name: 'K8sIngressList',
        path: '/K8S/ingress/list',
        component: () => import('#/views/K8S/ingress/list.vue'),
        meta: {
          icon: 'lucide:globe',
          title: '路由',
        },
      },
      {
        name: 'K8sIngressCreate',
        path: '/K8S/ingress/create',
        component: () => import('#/views/K8S/ingress/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建路由',
        },
      },
      // 存储管理
      {
        name: 'K8sPvcList',
        path: '/K8S/storage/pvc-list',
        component: () => import('#/views/K8S/storage/pvc-list.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: '存储卷',
        },
      },
      {
        name: 'K8sPvcCreate',
        path: '/K8S/storage/pvc-create',
        component: () => import('#/views/K8S/storage/pvc-create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建存储卷',
        },
      },
      {
        name: 'K8sPvList',
        path: '/K8S/storage/pv-list',
        component: () => import('#/views/K8S/storage/pv-list.vue'),
        meta: {
          hideInMenu: true,
          title: '持久卷',
        },
      },
      {
        name: 'K8sScList',
        path: '/K8S/storage/sc-list',
        component: () => import('#/views/K8S/storage/sc-list.vue'),
        meta: {
          hideInMenu: true,
          title: '存储类',
        },
      },
      // 配置中心
      {
        name: 'K8sConfigMapList',
        path: '/K8S/config/configmap-list',
        component: () => import('#/views/K8S/config/configmap-list.vue'),
        meta: {
          icon: 'lucide:file-cog',
          title: '配置字典',
        },
      },
      {
        name: 'K8sConfigMapDetail',
        path: '/K8S/config/configmap-detail/:clusterId/:namespace/:name',
        component: () => import('#/views/K8S/config/configmap-detail.vue'),
        meta: {
          hideInMenu: true,
          title: 'ConfigMap详情',
        },
      },
      {
        name: 'K8sSecretList',
        path: '/K8S/config/secret-list',
        component: () => import('#/views/K8S/config/secret-list.vue'),
        meta: {
          hideInMenu: true,
          title: '保密字典',
        },
      },
      {
        name: 'K8sSecretDetail',
        path: '/K8S/config/secret-detail/:clusterId/:namespace/:name',
        component: () => import('#/views/K8S/config/secret-detail.vue'),
        meta: {
          hideInMenu: true,
          title: 'Secret详情',
        },
      },
      // 终端
      {
        name: 'K8sTerminal',
        path: '/K8S/terminal/index',
        component: () => import('#/views/K8S/terminal/index.vue'),
        meta: {
          icon: 'lucide:terminal',
          title: '终端',
        },
      },
      // 访问控制 - RBAC
      {
        name: 'K8sClusterRoleList',
        path: '/K8S/rbac/clusterrole-list',
        component: () => import('#/views/K8S/rbac/clusterrole-list.vue'),
        meta: {
          icon: 'lucide:shield',
          title: '集群角色',
        },
      },
      {
        name: 'K8sRoleList',
        path: '/K8S/rbac/role-list',
        component: () => import('#/views/K8S/rbac/role-list.vue'),
        meta: {
          hideInMenu: true,
          title: '角色',
        },
      },
      {
        name: 'K8sServiceAccountList',
        path: '/K8S/rbac/serviceaccount-list',
        component: () => import('#/views/K8S/rbac/serviceaccount-list.vue'),
        meta: {
          hideInMenu: true,
          title: '服务账户',
        },
      },
      // 网络策略
      {
        name: 'K8sNetworkPolicyList',
        path: '/K8S/network/policy-list',
        component: () => import('#/views/K8S/network/policy-list.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: '网络策略',
        },
      },
      // 弹性伸缩
      {
        name: 'K8sHpaList',
        path: '/K8S/hpa/list',
        component: () => import('#/views/K8S/hpa/list.vue'),
        meta: {
          icon: 'lucide:scaling',
          title: '弹性伸缩',
        },
      },
      // 自定义资源 CRD
      {
        name: 'K8sCrdList',
        path: '/K8S/crd/list',
        component: () => import('#/views/K8S/crd/list.vue'),
        meta: {
          icon: 'lucide:puzzle',
          title: '自定义资源',
        },
      },
      {
        name: 'K8sCrdInstances',
        path: '/K8S/crd/instances',
        component: () => import('#/views/K8S/crd/instances.vue'),
        meta: {
          hideInMenu: true,
          title: 'CRD实例',
        },
      },
      // 监控告警
      {
        name: 'K8sClusterStatus',
        path: '/K8S/monitoring/cluster-status',
        component: () => import('#/views/K8S/monitoring/cluster-status.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '集群状态',
        },
      },
      {
        name: 'K8sAppResources',
        path: '/K8S/monitoring/app-resources',
        component: () => import('#/views/K8S/monitoring/app-resources.vue'),
        meta: {
          hideInMenu: true,
          title: '应用资源',
        },
      },
      {
        name: 'K8sMonitoringNodeDetail',
        path: '/K8S/monitoring/node-detail/:clusterId/:nodeName',
        component: () => import('#/views/K8S/monitoring/node-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '节点监控',
        },
      },
      {
        name: 'K8sEtcdMonitoring',
        path: '/K8S/monitoring/etcd',
        component: () => import('#/views/K8S/monitoring/etcd.vue'),
        meta: {
          hideInMenu: true,
          title: 'ETCD监控',
        },
      },
      {
        name: 'K8sApiServerMonitoring',
        path: '/K8S/monitoring/api-server',
        component: () => import('#/views/K8S/monitoring/api-server.vue'),
        meta: {
          hideInMenu: true,
          title: 'API Server监控',
        },
      },
      {
        name: 'K8sPrometheusConfig',
        path: '/K8S/monitoring/prometheus-config',
        component: () => import('#/views/K8S/monitoring/prometheus-config.vue'),
        meta: {
          hideInMenu: true,
          title: 'Prometheus配置',
        },
      },
      {
        name: 'K8sAlertRules',
        path: '/K8S/alert/rules',
        component: () => import('#/views/K8S/alert/rules.vue'),
        meta: {
          icon: 'lucide:bell',
          title: '告警规则',
        },
      },
      {
        name: 'K8sAlertHistory',
        path: '/K8S/alert/history',
        component: () => import('#/views/K8S/alert/history.vue'),
        meta: {
          hideInMenu: true,
          title: '告警历史',
        },
      },
      // 应用商店
      {
        name: 'K8sAppStore',
        path: '/K8S/appstore/index',
        component: () => import('#/views/K8S/appstore/index.vue'),
        meta: {
          icon: 'lucide:store',
          title: '应用商店',
        },
      },
      {
        name: 'K8sAppDetail',
        path: '/K8S/appstore/detail',
        component: () => import('#/views/K8S/appstore/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '应用详情',
        },
      },
      {
        name: 'K8sAppInstall',
        path: '/K8S/appstore/install',
        component: () => import('#/views/K8S/appstore/install.vue'),
        meta: {
          hideInMenu: true,
          title: '部署应用',
        },
      },
      {
        name: 'K8sHelmRepos',
        path: '/K8S/appstore/repos',
        component: () => import('#/views/K8S/appstore/repos.vue'),
        meta: {
          hideInMenu: true,
          title: 'Helm仓库',
        },
      },
      {
        name: 'K8sHelmReleases',
        path: '/K8S/appstore/releases',
        component: () => import('#/views/K8S/appstore/releases.vue'),
        meta: {
          hideInMenu: true,
          title: '已安装应用',
        },
      },
      {
        name: 'K8sTemplateInstall',
        path: '/K8S/appstore/template-install',
        component: () => import('#/views/K8S/appstore/template-install.vue'),
        meta: {
          hideInMenu: true,
          title: '模板部署',
        },
      },
      // DevOps 流水线
      {
        name: 'K8sDevOps',
        path: '/K8S/devops/projects',
        component: () => import('#/views/K8S/devops/projects.vue'),
        meta: {
          icon: 'lucide:workflow',
          title: 'DevOps流水线',
        },
      },
      {
        name: 'K8sDevOpsProjectDetail',
        path: '/K8S/devops/projects/:projectId',
        component: () => import('#/views/K8S/devops/project-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '工程详情',
        },
      },
      {
        name: 'K8sDevOpsPipelineCreate',
        path: '/K8S/devops/projects/:projectId/pipeline/create',
        component: () => import('#/views/K8S/devops/pipeline-create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建流水线',
        },
      },
      {
        name: 'K8sDevOpsPipelineDetail',
        path: '/K8S/devops/projects/:projectId/pipelines/:pipelineId',
        component: () => import('#/views/K8S/devops/pipeline-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '流水线详情',
        },
      },
      {
        name: 'K8sDevOpsRunDetail',
        path: '/K8S/devops/projects/:projectId/pipelines/:pipelineId/runs/:runId',
        component: () => import('#/views/K8S/devops/run-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '运行详情',
        },
      },
      // 集群部署
      {
        name: 'K8sDeployList',
        path: '/K8S/deploy/list',
        component: () => import('#/views/K8S/deploy/list.vue'),
        meta: {
          icon: 'lucide:rocket',
          title: '集群部署',
        },
      },
      {
        name: 'K8sDeployCreate',
        path: '/K8S/deploy/create',
        component: () => import('#/views/K8S/deploy/create.vue'),
        meta: {
          hideInMenu: true,
          title: '创建部署计划',
        },
      },
      {
        name: 'K8sDeployDetail',
        path: '/K8S/deploy/detail/:id',
        component: () => import('#/views/K8S/deploy/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '部署详情',
        },
      },
      {
        name: 'K8sDeployAddNode',
        path: '/K8S/deploy/add-node/:planId',
        component: () => import('#/views/K8S/deploy/add-node.vue'),
        meta: {
          hideInMenu: true,
          title: '扩容节点',
        },
      },
    ],
  },
];

export default routes;
