<script lang="ts" setup>
import type { Registry, DeployLog } from '../api/types';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tabs,
  TabPane,
  Tag,
  Timeline,
  TimelineItem,
  Tooltip,
} from 'ant-design-vue';

import { getRegistry, updateRegistry } from '../api/registry';
import { getDeployLogs, upgradeRegistry } from '../api/deploy';
import { getProjects, createProject, deleteProject } from '../api/project';
import { getRepositories, getArtifacts, getTags, deleteTag, getUsers, createUser, deleteUser } from '../api/repository';
import { createSyncTask, getSyncTasks, deleteSyncTask, retrySyncTask, refreshSyncTasks, batchSyncImages, extractImagesFromYaml } from '../api/sync';
import type { SyncTask } from '../api/sync';
import {
  getEndpoints, createEndpoint, deleteEndpoint, pingEndpoint,
  getReplicationPolicies, createReplicationPolicy, deleteReplicationPolicy,
  triggerReplication, getReplicationExecutions, getReplicationTasks,
} from '../api/replication';

const route = useRoute();
const router = useRouter();
const registryId = Number(route.params.id);
const activeTab = ref('overview');

const registry = ref<Registry | null>(null);
const deployLogs = ref<DeployLog[]>([]);
const projects = ref<any[]>([]);
const repositories = ref<any[]>([]);
const users = ref<any[]>([]);
const selectedProject = ref('');
const selectedRepo = ref('');
const artifacts = ref<any[]>([]);
const loading = ref(false);

// Sync state
const syncTasks = ref<SyncTask[]>([]);
const syncSourceImage = ref('');
const syncTargetProject = ref('');
const syncMethod = ref('harbor_replication');
const syncLoading = ref(false);

// Batch sync state
const batchMode = ref<'list' | 'yaml'>('list');
const batchImageList = ref('');
const batchYaml = ref('');
const batchExtractedImages = ref<string[]>([]);
const batchTargetProject = ref('library');
const batchSyncMethod = ref('harbor_replication');

// Replication state
const endpoints = ref<any[]>([]);
const policies = ref<any[]>([]);
const executions = ref<any[]>([]);
const execTasks = ref<any[]>([]);
const selectedPolicyId = ref<number | null>(null);
const selectedExecId = ref<number | null>(null);
const replicLoading = ref(false);
const showEndpointForm = ref(false);
const showPolicyForm = ref(false);
const epForm = ref({ name: '', url: '', type: 'docker-hub', insecure: false, accessKey: '', accessSecret: '' });
const policyForm = ref({ name: '', endpointId: null as number | null, filter: '', tag: '', destProject: '', cron: '' });

const isRunning = computed(() => registry.value?.status === 'running');
const isHarbor = computed(() => registry.value?.registryType === 'harbor');

// New project form
const newProjectName = ref('');
const newProjectPublic = ref(true);

const typeLabelMap: Record<string, string> = {
  harbor: 'Harbor',
  gitlab: 'GitLab',
  docker_distribution: 'Docker Registry',
};

const statusColorMap: Record<string, string> = {
  not_deployed: 'default',
  deploying: 'processing',
  running: 'success',
  stopped: 'warning',
  failed: 'error',
  uninstalling: 'processing',
};

const statusLabelMap: Record<string, string> = {
  not_deployed: '未部署',
  deploying: '部署中',
  running: '运行中',
  stopped: '已停止',
  failed: '失败',
  uninstalling: '卸载中',
};

const logStatusColor: Record<string, string> = {
  running: 'blue',
  success: 'green',
  failed: 'red',
};

const actionLabelMap: Record<string, string> = {
  install: '安装',
  upgrade: '升级',
  uninstall: '卸载',
  start: '启动',
  stop: '停止',
  restart: '重启',
};

const projectColumns = [
  { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
  { title: '可见性', dataIndex: 'metadata', key: 'visibility' },
  { title: '操作', key: 'action', width: 120 },
];

const repoColumns = [
  { title: '仓库名称', dataIndex: 'name', key: 'name' },
  { title: 'Artifact 数', dataIndex: 'artifact_count', key: 'artifact_count', width: 100 },
  { title: '拉取次数', dataIndex: 'pull_count', key: 'pull_count', width: 100 },
  { title: '更新时间', dataIndex: 'update_time', key: 'update_time', width: 180 },
  { title: '操作', key: 'action', width: 120 },
];

const artifactColumns = [
  { title: 'Digest', dataIndex: 'digest', key: 'digest' },
  { title: '标签', key: 'tags' },
  { title: '大小', key: 'size', width: 100 },
  { title: '架构', key: 'arch', width: 120 },
  { title: '推送时间', dataIndex: 'push_time', key: 'push_time', width: 180 },
  { title: '操作', key: 'action', width: 120 },
];

const userColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '操作', key: 'action', width: 120 },
];

const syncTaskColumns = [
  { title: '源镜像', dataIndex: 'sourceImage', key: 'sourceImage' },
  { title: '目标项目', dataIndex: 'targetProject', key: 'targetProject', width: 120 },
  { title: '同步方式', dataIndex: 'syncMethod', key: 'syncMethod', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '详情', dataIndex: 'statusDetail', key: 'statusDetail', ellipsis: true },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 130 },
];

async function fetchRegistry() {
  try {
    const res = await getRegistry(registryId);
    registry.value = res as any;
  } catch (e: any) {
    message.error('获取仓库信息失败');
  }
}

async function fetchDeployLogs() {
  try {
    const res = await getDeployLogs(registryId);
    deployLogs.value = Array.isArray(res) ? res : [];
  } catch {
    deployLogs.value = [];
  }
}

async function fetchProjects() {
  loading.value = true;
  try {
    const res = await getProjects(registryId);
    projects.value = Array.isArray(res) ? res : [];
  } catch {
    projects.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchRepos(projectName?: string) {
  loading.value = true;
  selectedRepo.value = '';
  artifacts.value = [];
  try {
    const pn = projectName || selectedProject.value || undefined;
    const res = await getRepositories(registryId, pn);
    repositories.value = Array.isArray(res) ? res : [];
  } catch {
    repositories.value = [];
  } finally {
    loading.value = false;
  }
}

function handleProjectFilter(projectName: string) {
  selectedProject.value = projectName;
  fetchRepos(projectName);
}

async function fetchArtifacts(repoName: string) {
  selectedRepo.value = repoName;
  loading.value = true;
  try {
    // repoName format: "projectName/repoName", split for API call
    const parts = repoName.split('/');
    const project = parts.length > 1 ? parts[0]! : selectedProject.value || 'library';
    const repo = parts.length > 1 ? parts.slice(1).join('/') : repoName;
    const res = await getArtifacts(registryId, project, repo);
    artifacts.value = Array.isArray(res) ? res : [];
  } catch {
    artifacts.value = [];
  } finally {
    loading.value = false;
  }
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

function getArtifactTags(record: any): string[] {
  if (record.tags && Array.isArray(record.tags)) {
    return record.tags.map((t: any) => t.name || t);
  }
  if (record.name) return [record.name];
  return [];
}

function shortDigest(digest: string): string {
  if (!digest) return '-';
  return digest.length > 19 ? digest.substring(0, 19) + '...' : digest;
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await getUsers(registryId);
    users.value = Array.isArray(res) ? res : [];
  } catch {
    users.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleCreateProject() {
  if (!newProjectName.value) {
    message.warning('请输入项目名称');
    return;
  }
  try {
    await createProject(registryId, newProjectName.value, newProjectPublic.value);
    message.success('项目创建成功');
    newProjectName.value = '';
    fetchProjects();
  } catch (e: any) {
    message.error('创建项目失败: ' + (e.message || e));
  }
}

async function handleDeleteProject(projectId: string) {
  Modal.confirm({
    title: '确认删除项目',
    content: '此操作不可恢复，确定删除？',
    okType: 'danger',
    async onOk() {
      try {
        await deleteProject(registryId, projectId);
        message.success('项目已删除');
        fetchProjects();
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

async function handleDeleteTag(repoName: string, tagName: string) {
  Modal.confirm({
    title: '确认删除标签',
    content: `确定删除标签 ${tagName} 吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteTag(registryId, repoName, tagName);
        message.success('标签已删除');
        fetchArtifacts(repoName);
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

async function handleDeleteUser(userId: string) {
  Modal.confirm({
    title: '确认删除用户',
    content: '确定删除此用户？',
    okType: 'danger',
    async onOk() {
      try {
        await deleteUser(registryId, userId);
        message.success('用户已删除');
        fetchUsers();
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

async function handleUpgrade() {
  Modal.confirm({
    title: '确认升级',
    content: '确定要升级此仓库？',
    async onOk() {
      try {
        await upgradeRegistry(registryId);
        message.success('升级任务已提交');
        fetchRegistry();
      } catch (e: any) {
        message.error('升级失败: ' + (e.message || e));
      }
    },
  });
}

// ==================== Sync ====================

async function fetchSyncTasks() {
  syncLoading.value = true;
  try {
    const res = await getSyncTasks(registryId);
    syncTasks.value = Array.isArray(res) ? res : [];
  } catch {
    syncTasks.value = [];
  } finally {
    syncLoading.value = false;
  }
}

async function handleSync() {
  if (!syncSourceImage.value.trim()) {
    message.warning('请输入源镜像地址');
    return;
  }
  syncLoading.value = true;
  try {
    await createSyncTask(registryId, {
      sourceImage: syncSourceImage.value.trim(),
      targetProject: syncTargetProject.value || 'library',
      syncMethod: syncMethod.value,
    });
    message.success('同步任务已提交');
    syncSourceImage.value = '';
    fetchSyncTasks();
  } catch (e: any) {
    message.error('同步失败: ' + (e.message || e));
  } finally {
    syncLoading.value = false;
  }
}

async function handleRefreshSync() {
  try {
    await refreshSyncTasks(registryId);
    message.success('已刷新任务状态');
    fetchSyncTasks();
  } catch (e: any) {
    message.error('刷新失败: ' + (e.message || e));
  }
}

async function handleDeleteSyncTask(taskId: number) {
  Modal.confirm({
    title: '确认删除',
    content: '确定删除此同步任务记录？',
    okType: 'danger',
    async onOk() {
      try {
        await deleteSyncTask(registryId, taskId);
        message.success('已删除');
        fetchSyncTasks();
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

const retryingTaskIds = ref<Set<number>>(new Set());

async function handleRetrySyncTask(taskId: number) {
  retryingTaskIds.value.add(taskId);
  try {
    await retrySyncTask(registryId, taskId);
    message.success('重试任务已提交');
    await fetchSyncTasks();
  } catch (e: any) {
    message.error('重试失败: ' + (e.message || e));
  } finally {
    retryingTaskIds.value.delete(taskId);
  }
}

// ==================== Batch Sync ====================

async function handleExtractImages() {
  if (!batchYaml.value.trim()) {
    message.warning('请粘贴 K8s YAML 内容');
    return;
  }
  syncLoading.value = true;
  try {
    const res = await extractImagesFromYaml(registryId, batchYaml.value);
    batchExtractedImages.value = Array.isArray(res) ? res : [];
    if (batchExtractedImages.value.length === 0) {
      message.info('未从 YAML 中提取到镜像');
    } else {
      message.success(`提取到 ${batchExtractedImages.value.length} 个镜像`);
    }
  } catch (e: any) {
    message.error('提取失败: ' + (e.message || e));
  } finally {
    syncLoading.value = false;
  }
}

async function handleBatchSync() {
  let images: string[] = [];

  if (batchMode.value === 'yaml') {
    images = [...batchExtractedImages.value];
  } else {
    images = batchImageList.value
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'));
  }

  if (images.length === 0) {
    message.warning('没有要同步的镜像');
    return;
  }

  Modal.confirm({
    title: '确认批量同步',
    content: `将同步 ${images.length} 个镜像到项目 "${batchTargetProject.value}"，确定继续？`,
    async onOk() {
      syncLoading.value = true;
      try {
        await batchSyncImages(registryId, {
          images,
          targetProject: batchTargetProject.value || 'library',
          syncMethod: batchSyncMethod.value,
        });
        message.success(`已提交 ${images.length} 个同步任务`);
        batchImageList.value = '';
        batchYaml.value = '';
        batchExtractedImages.value = [];
        fetchSyncTasks();
      } catch (e: any) {
        message.error('批量同步失败: ' + (e.message || e));
      } finally {
        syncLoading.value = false;
      }
    },
  });
}

function removeExtractedImage(index: number) {
  batchExtractedImages.value.splice(index, 1);
}

// K8s common images preset (with recommended versions for K8s 1.30+)
const k8sPresetImages = [
  'registry.k8s.io/kube-apiserver:v1.30.2',
  'registry.k8s.io/kube-controller-manager:v1.30.2',
  'registry.k8s.io/kube-scheduler:v1.30.2',
  'registry.k8s.io/kube-proxy:v1.30.2',
  'registry.k8s.io/coredns/coredns:v1.11.1',
  'registry.k8s.io/etcd:3.5.12-0',
  'registry.k8s.io/pause:3.9',
  'calico/node:v3.28.0',
  'calico/cni:v3.28.0',
  'calico/kube-controllers:v3.28.0',
  'registry.k8s.io/ingress-nginx/controller:v1.10.1',
  'registry.k8s.io/metrics-server/metrics-server:v0.7.1',
];

function fillPresetImages() {
  batchImageList.value = k8sPresetImages.join('\n');
}

const syncStatusColor: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
};

const syncStatusLabel: Record<string, string> = {
  pending: '等待中',
  running: '同步中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
};

const syncMethodLabel: Record<string, string> = {
  harbor_replication: 'Harbor Replication',
  skopeo: 'Skopeo',
};

// ==================== Replication ====================

const endpointColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: 'URL', dataIndex: 'url', key: 'url' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 160 },
];

const policyColumns = [
  { title: '策略名称', dataIndex: 'name', key: 'name' },
  { title: '源仓库', key: 'src', width: 160 },
  { title: '目标项目', dataIndex: 'dest_namespace', key: 'dest_namespace', width: 120 },
  { title: '触发方式', key: 'trigger', width: 100 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 200 },
];

const executionColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '触发', dataIndex: 'trigger', key: 'trigger', width: 80 },
  { title: '成功', dataIndex: 'succeed', key: 'succeed', width: 60 },
  { title: '失败', dataIndex: 'failed', key: 'failed', width: 60 },
  { title: '进行中', dataIndex: 'in_progress', key: 'in_progress', width: 70 },
  { title: '开始', dataIndex: 'start_time', key: 'start_time', width: 160 },
  { title: '操作', key: 'action', width: 100 },
];

const execTaskColumns = [
  { title: '资源类型', dataIndex: 'resource_type', key: 'resource_type', width: 100 },
  { title: '源', dataIndex: 'src_resource', key: 'src_resource' },
  { title: '目标', dataIndex: 'dst_resource', key: 'dst_resource' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始', dataIndex: 'start_time', key: 'start_time', width: 160 },
];

const endpointTypes = [
  { value: 'docker-hub', label: 'Docker Hub' },
  { value: 'docker-registry', label: 'Docker Registry' },
  { value: 'harbor', label: 'Harbor' },
  { value: 'google-gcr', label: 'Google GCR' },
  { value: 'github-ghcr', label: 'GitHub GHCR' },
  { value: 'quay', label: 'Quay.io' },
  { value: 'aws-ecr', label: 'AWS ECR' },
];

async function fetchEndpoints() {
  replicLoading.value = true;
  try {
    const res = await getEndpoints(registryId);
    endpoints.value = Array.isArray(res) ? res : [];
  } catch {
    endpoints.value = [];
  } finally {
    replicLoading.value = false;
  }
}

async function fetchPolicies() {
  replicLoading.value = true;
  try {
    const res = await getReplicationPolicies(registryId);
    policies.value = Array.isArray(res) ? res : [];
  } catch {
    policies.value = [];
  } finally {
    replicLoading.value = false;
  }
}

async function fetchExecutions(policyId: number) {
  selectedPolicyId.value = policyId;
  selectedExecId.value = null;
  execTasks.value = [];
  replicLoading.value = true;
  try {
    const res = await getReplicationExecutions(registryId, policyId);
    executions.value = Array.isArray(res) ? res : [];
  } catch {
    executions.value = [];
  } finally {
    replicLoading.value = false;
  }
}

async function fetchExecTasks(execId: number) {
  selectedExecId.value = execId;
  replicLoading.value = true;
  try {
    const res = await getReplicationTasks(registryId, execId);
    execTasks.value = Array.isArray(res) ? res : [];
  } catch {
    execTasks.value = [];
  } finally {
    replicLoading.value = false;
  }
}

async function handleCreateEndpoint() {
  if (!epForm.value.name || !epForm.value.url) {
    message.warning('请填写名称和 URL');
    return;
  }
  try {
    await createEndpoint(registryId, {
      name: epForm.value.name,
      url: epForm.value.url,
      type: epForm.value.type,
      insecure: epForm.value.insecure,
      credential: {
        type: 'basic',
        access_key: epForm.value.accessKey,
        access_secret: epForm.value.accessSecret,
      },
    });
    message.success('外部仓库已添加');
    showEndpointForm.value = false;
    epForm.value = { name: '', url: '', type: 'docker-hub', insecure: false, accessKey: '', accessSecret: '' };
    fetchEndpoints();
  } catch (e: any) {
    message.error('添加失败: ' + (e.message || e));
  }
}

async function handlePingEndpoint(ep: any) {
  try {
    const res = await pingEndpoint(registryId, {
      name: ep.name, url: ep.url, type: ep.type, insecure: ep.insecure,
      credential: ep.credential,
    });
    const data = res as any;
    if (data?.status === 'ok' || data?.status === 'created') {
      message.success('连通性测试成功');
    } else {
      message.warning('测试结果: ' + (data?.message || JSON.stringify(data)));
    }
  } catch (e: any) {
    message.error('测试失败: ' + (e.message || e));
  }
}

async function handleDeleteEndpoint(endpointId: number) {
  Modal.confirm({
    title: '确认删除外部仓库',
    content: '关联的复制策略可能受影响，确定删除？',
    okType: 'danger',
    async onOk() {
      try {
        await deleteEndpoint(registryId, endpointId);
        message.success('已删除');
        fetchEndpoints();
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

async function handleCreatePolicy() {
  if (!policyForm.value.name || !policyForm.value.endpointId) {
    message.warning('请填写策略名称并选择源仓库');
    return;
  }
  const filters: any[] = [];
  if (policyForm.value.filter) {
    filters.push({ type: 'name', value: policyForm.value.filter });
  }
  if (policyForm.value.tag) {
    filters.push({ type: 'tag', value: policyForm.value.tag });
  }
  const trigger: any = policyForm.value.cron
    ? { type: 'scheduled', trigger_settings: { cron: policyForm.value.cron } }
    : { type: 'manual' };

  try {
    await createReplicationPolicy(registryId, {
      name: policyForm.value.name,
      src_registry: { id: policyForm.value.endpointId },
      dest_namespace: policyForm.value.destProject || '',
      dest_namespace_replace_count: policyForm.value.destProject ? 1 : 0,
      filters,
      trigger,
      enabled: true,
      override: true,
      deletion: false,
    });
    message.success('同步策略已创建');
    showPolicyForm.value = false;
    policyForm.value = { name: '', endpointId: null, filter: '', tag: '', destProject: '', cron: '' };
    fetchPolicies();
  } catch (e: any) {
    message.error('创建失败: ' + (e.message || e));
  }
}

async function handleTriggerPolicy(policyId: number) {
  try {
    await triggerReplication(registryId, { policy_id: policyId });
    message.success('已触发同步执行');
    fetchExecutions(policyId);
  } catch (e: any) {
    message.error('触发失败: ' + (e.message || e));
  }
}

async function handleDeletePolicy(policyId: number) {
  Modal.confirm({
    title: '确认删除策略',
    content: '删除策略后，历史执行记录也将不可查看。',
    okType: 'danger',
    async onOk() {
      try {
        await deleteReplicationPolicy(registryId, policyId);
        message.success('策略已删除');
        fetchPolicies();
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

function getEndpointNameById(id: number): string {
  const ep = endpoints.value.find((e: any) => e.id === id);
  return ep ? ep.name : `ID: ${id}`;
}

function handleTabChange(key: string) {
  activeTab.value = key;
  // Only fetch registry API data when running
  if (['projects', 'repositories', 'users', 'sync', 'replication'].includes(key) && !isRunning.value) {
    return;
  }
  switch (key) {
    case 'projects':
      fetchProjects();
      break;
    case 'repositories':
      fetchProjects();
      fetchRepos();
      break;
    case 'users':
      fetchUsers();
      break;
    case 'sync':
      fetchSyncTasks();
      if (projects.value.length === 0) fetchProjects();
      break;
    case 'replication':
      fetchEndpoints();
      fetchPolicies();
      break;
    case 'logs':
      fetchDeployLogs();
      break;
  }
}

onMounted(() => {
  fetchRegistry();
  fetchDeployLogs();
});
</script>

<template>
  <div class="p-4">
    <Card>
      <template #title>
        <Space>
          <Button size="small" @click="router.push('/REG/registry/list')">返回</Button>
          <span>{{ registry?.registryName || '仓库详情' }}</span>
          <Tag v-if="registry" :color="statusColorMap[registry.status]">
            {{ statusLabelMap[registry.status] || registry.status }}
          </Tag>
        </Space>
      </template>

      <Tabs :active-key="activeTab" @change="handleTabChange">
        <!-- Tab: Overview -->
        <TabPane key="overview" tab="概览">
          <Descriptions v-if="registry" :column="2" bordered>
            <DescriptionsItem label="仓库名称">{{ registry.registryName }}</DescriptionsItem>
            <DescriptionsItem label="仓库类型">
              <Tag>{{ typeLabelMap[registry.registryType] || registry.registryType }}</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="版本">{{ registry.version || '-' }}</DescriptionsItem>
            <DescriptionsItem label="部署方式">
              <Tag :color="registry.deployMode === 'ssh' ? 'purple' : 'cyan'">
                {{ registry.deployMode === 'ssh' ? 'SSH' : 'K8s' }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="访问地址" :span="2">
              <a v-if="registry.endpoint" :href="registry.endpoint" target="_blank">{{ registry.endpoint }}</a>
              <span v-else>-</span>
            </DescriptionsItem>
            <DescriptionsItem label="管理员用户">{{ registry.adminUser || '-' }}</DescriptionsItem>
            <DescriptionsItem label="SSL">{{ registry.useSsl ? '是' : '否' }}</DescriptionsItem>
            <DescriptionsItem v-if="registry.deployMode === 'ssh'" label="目标主机">
              {{ registry.host }}:{{ registry.sshPort || 22 }}
            </DescriptionsItem>
            <DescriptionsItem v-if="registry.deployMode === 'ssh'" label="安装路径">
              {{ registry.installPath || '-' }}
            </DescriptionsItem>
            <DescriptionsItem v-if="registry.deployMode === 'k8s'" label="集群 ID">
              {{ registry.clusterId }}
            </DescriptionsItem>
            <DescriptionsItem v-if="registry.deployMode === 'k8s'" label="命名空间">
              {{ registry.namespace }}
            </DescriptionsItem>
            <DescriptionsItem label="描述" :span="2">{{ registry.description || '-' }}</DescriptionsItem>
            <DescriptionsItem label="创建时间">{{ registry.createdAt }}</DescriptionsItem>
            <DescriptionsItem label="更新时间">{{ registry.updatedAt }}</DescriptionsItem>
          </Descriptions>
        </TabPane>

        <!-- Tab: Projects -->
        <TabPane key="projects" tab="项目">
          <template v-if="isRunning">
            <div class="mb-4">
              <Space>
                <Input v-model:value="newProjectName" placeholder="项目名称" style="width: 200px" />
                <Button type="primary" size="small" @click="handleCreateProject">创建项目</Button>
              </Space>
            </div>
            <Table :columns="projectColumns" :data-source="projects" :loading="loading" row-key="id" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'visibility'">
                  {{ record.metadata?.public === 'true' ? '公开' : '私有' }}
                </template>
                <template v-if="column.key === 'action'">
                  <Button size="small" type="link" danger @click="handleDeleteProject(record.project_id || record.id)">
                    删除
                  </Button>
                </template>
              </template>
            </Table>
          </template>
          <p v-else class="text-gray-400">仓库未运行，无法获取项目列表。当前状态: {{ statusLabelMap[registry?.status || ''] || registry?.status }}</p>
        </TabPane>

        <!-- Tab: Repositories (Enhanced) -->
        <TabPane key="repositories" tab="镜像仓库">
          <template v-if="isRunning">
            <!-- Project filter -->
            <div class="mb-4">
              <Space>
                <span class="text-gray-500">按项目筛选:</span>
                <Button
                  :type="selectedProject === '' ? 'primary' : 'default'"
                  size="small"
                  @click="handleProjectFilter('')"
                >全部</Button>
                <Button
                  v-for="p in projects"
                  :key="p.project_id || p.name"
                  :type="selectedProject === (p.name || p.project_name) ? 'primary' : 'default'"
                  size="small"
                  @click="handleProjectFilter(p.name || p.project_name)"
                >{{ p.name || p.project_name }}</Button>
              </Space>
            </div>

            <!-- Repository table -->
            <Table :columns="repoColumns" :data-source="repositories" :loading="loading" row-key="name" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a style="cursor:pointer" @click="fetchArtifacts(record.name)">{{ record.name }}</a>
                </template>
                <template v-if="column.key === 'artifact_count'">
                  {{ record.artifact_count ?? '-' }}
                </template>
                <template v-if="column.key === 'pull_count'">
                  {{ record.pull_count ?? '-' }}
                </template>
                <template v-if="column.key === 'update_time'">
                  {{ record.update_time ? record.update_time.substring(0, 19).replace('T', ' ') : '-' }}
                </template>
                <template v-if="column.key === 'action'">
                  <Button size="small" type="link" @click="fetchArtifacts(record.name)">
                    查看 Artifacts
                  </Button>
                </template>
              </template>
            </Table>

            <!-- Artifact detail panel -->
            <div v-if="selectedRepo" class="mt-4">
              <div class="mb-2 flex items-center gap-2">
                <h4 class="m-0">{{ selectedRepo }}</h4>
                <Button size="small" @click="selectedRepo = ''; artifacts = []">关闭</Button>
              </div>
              <Table :columns="artifactColumns" :data-source="artifacts" :loading="loading" row-key="digest" size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'digest'">
                    <span :title="record.digest">{{ shortDigest(record.digest) }}</span>
                  </template>
                  <template v-if="column.key === 'tags'">
                    <Space v-if="getArtifactTags(record).length">
                      <Tag v-for="t in getArtifactTags(record)" :key="t" color="blue">{{ t }}</Tag>
                    </Space>
                    <span v-else class="text-gray-400">无标签</span>
                  </template>
                  <template v-if="column.key === 'size'">
                    {{ formatSize(record.size) }}
                  </template>
                  <template v-if="column.key === 'arch'">
                    {{ record.extra_attrs?.architecture || record.architecture || '-' }}
                    <span v-if="record.extra_attrs?.os || record.os" class="text-gray-400">
                      /{{ record.extra_attrs?.os || record.os }}
                    </span>
                  </template>
                  <template v-if="column.key === 'push_time'">
                    {{ record.push_time ? record.push_time.substring(0, 19).replace('T', ' ') : '-' }}
                  </template>
                  <template v-if="column.key === 'action'">
                    <Space>
                      <Button
                        v-for="t in getArtifactTags(record)"
                        :key="t"
                        size="small"
                        type="link"
                        danger
                        @click="handleDeleteTag(selectedRepo, t)"
                      >删除 {{ t }}</Button>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>
          </template>
          <p v-else class="text-gray-400">仓库未运行，无法获取镜像仓库列表。</p>
        </TabPane>

        <!-- Tab: Users (Harbor/GitLab only) -->
        <TabPane
          v-if="registry && registry.registryType !== 'docker_distribution'"
          key="users"
          tab="用户"
        >
          <template v-if="isRunning">
            <Table :columns="userColumns" :data-source="users" :loading="loading" row-key="user_id" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <Button size="small" type="link" danger @click="handleDeleteUser(record.user_id || record.id)">
                    删除
                  </Button>
                </template>
              </template>
            </Table>
          </template>
          <p v-else class="text-gray-400">仓库未运行，无法获取用户列表。当前状态: {{ statusLabelMap[registry?.status || ''] || registry?.status }}</p>
        </TabPane>

        <!-- Tab: Image Sync (Harbor only) -->
        <TabPane v-if="isHarbor" key="sync" tab="镜像同步">
          <template v-if="isRunning">
            <!-- Sync form -->
            <div class="mb-4 rounded border border-gray-200 p-4">
              <h4 class="mb-3 mt-0">拉取外部镜像到本地 Harbor</h4>
              <Space direction="vertical" style="width: 100%">
                <div class="flex gap-3">
                  <Input
                    v-model:value="syncSourceImage"
                    placeholder="源镜像地址，如 nginx:1.25 或 gcr.io/google-samples/hello-app:1.0"
                    style="flex: 1"
                  />
                  <Input
                    v-model:value="syncTargetProject"
                    placeholder="目标项目 (默认 library)"
                    style="width: 160px"
                  />
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">同步方式:</span>
                  <Button
                    :type="syncMethod === 'harbor_replication' ? 'primary' : 'default'"
                    size="small"
                    @click="syncMethod = 'harbor_replication'"
                  >Harbor Replication</Button>
                  <Button
                    v-if="registry?.deployMode === 'ssh'"
                    :type="syncMethod === 'skopeo' ? 'primary' : 'default'"
                    size="small"
                    @click="syncMethod = 'skopeo'"
                  >Skopeo (SSH)</Button>
                  <div style="flex:1" />
                  <Button type="primary" :loading="syncLoading" @click="handleSync">开始同步</Button>
                </div>
              </Space>
              <div class="mt-2 text-xs text-gray-400">
                Harbor Replication: 通过 Harbor 内置复制策略从 Docker Hub/GCR/Quay 等拉取。
                Skopeo: 通过 SSH 在目标机器执行 skopeo copy (需已安装 skopeo)。
              </div>
            </div>

            <!-- Batch sync -->
            <div class="mb-4 rounded border border-gray-200 p-4">
              <div class="mb-3 flex items-center justify-between">
                <h4 class="m-0">批量同步 (K8s 镜像预拉取)</h4>
                <Space>
                  <Button
                    :type="batchMode === 'list' ? 'primary' : 'default'"
                    size="small"
                    @click="batchMode = 'list'"
                  >镜像列表</Button>
                  <Button
                    :type="batchMode === 'yaml' ? 'primary' : 'default'"
                    size="small"
                    @click="batchMode = 'yaml'"
                  >从 YAML 提取</Button>
                </Space>
              </div>

              <!-- Mode: Image list -->
              <template v-if="batchMode === 'list'">
                <div class="mb-2 flex items-center gap-2">
                  <span class="text-gray-500">每行一个镜像地址，# 开头为注释</span>
                  <Button size="small" @click="fillPresetImages">填入 K8s 常用镜像</Button>
                </div>
                <Input.TextArea
                  v-model:value="batchImageList"
                  :rows="8"
                  placeholder="nginx:1.25
registry.k8s.io/coredns/coredns:v1.11.1
registry.k8s.io/kube-proxy:v1.30.0
calico/node:v3.28.0
# 注释行会被忽略"
                />
              </template>

              <!-- Mode: YAML extract -->
              <template v-else>
                <div class="mb-2 text-gray-500">粘贴 K8s Deployment/DaemonSet/StatefulSet YAML，自动提取所有 image 字段</div>
                <Input.TextArea
                  v-model:value="batchYaml"
                  :rows="8"
                  placeholder="apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx:1.25"
                />
                <div class="mt-2">
                  <Button size="small" type="primary" :loading="syncLoading" @click="handleExtractImages">
                    提取镜像
                  </Button>
                </div>
                <!-- Extracted images -->
                <div v-if="batchExtractedImages.length > 0" class="mt-3">
                  <div class="mb-1 text-gray-500">已提取 {{ batchExtractedImages.length }} 个镜像:</div>
                  <div class="flex flex-wrap gap-1">
                    <Tag
                      v-for="(img, idx) in batchExtractedImages"
                      :key="idx"
                      closable
                      color="blue"
                      @close="removeExtractedImage(idx)"
                    >{{ img }}</Tag>
                  </div>
                </div>
              </template>

              <!-- Batch sync controls -->
              <div class="mt-3 flex items-center gap-3">
                <span class="text-gray-500">目标项目:</span>
                <Input v-model:value="batchTargetProject" style="width:140px" placeholder="library" />
                <span class="text-gray-500">同步方式:</span>
                <Button
                  :type="batchSyncMethod === 'harbor_replication' ? 'primary' : 'default'"
                  size="small"
                  @click="batchSyncMethod = 'harbor_replication'"
                >Harbor Replication</Button>
                <Button
                  v-if="registry?.deployMode === 'ssh'"
                  :type="batchSyncMethod === 'skopeo' ? 'primary' : 'default'"
                  size="small"
                  @click="batchSyncMethod = 'skopeo'"
                >Skopeo</Button>
                <div style="flex:1" />
                <Button type="primary" :loading="syncLoading" @click="handleBatchSync">批量同步</Button>
              </div>
            </div>

            <!-- Sync tasks list -->
            <div class="mb-2 flex items-center justify-between">
              <h4 class="m-0">同步任务</h4>
              <Button size="small" @click="handleRefreshSync">刷新状态</Button>
            </div>
            <Table
              :columns="syncTaskColumns"
              :data-source="syncTasks"
              :loading="syncLoading"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'syncMethod'">
                  {{ syncMethodLabel[record.syncMethod] || record.syncMethod }}
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="syncStatusColor[record.status]">
                    {{ syncStatusLabel[record.status] || record.status }}
                  </Tag>
                </template>
                <template v-if="column.key === 'statusDetail'">
                  <span :title="record.statusDetail">{{ record.statusDetail || '-' }}</span>
                </template>
                <template v-if="column.key === 'createdAt'">
                  {{ record.createdAt || '-' }}
                </template>
                <template v-if="column.key === 'action'">
                  <Space>
                    <Button
                      v-if="record.status === 'failed' || record.status === 'cancelled'"
                      size="small"
                      type="link"
                      :loading="retryingTaskIds.has(record.id)"
                      @click="handleRetrySyncTask(record.id)"
                    >重试</Button>
                    <Button
                      v-if="record.status !== 'running'"
                      size="small"
                      type="link"
                      danger
                      @click="handleDeleteSyncTask(record.id)"
                    >删除</Button>
                  </Space>
                </template>
              </template>
            </Table>
            <p v-if="syncTasks.length === 0" class="text-gray-400">暂无同步任务</p>
          </template>
          <p v-else class="text-gray-400">仓库未运行，无法执行镜像同步。</p>
        </TabPane>

        <!-- Tab: Replication (Harbor only) -->
        <TabPane v-if="isHarbor" key="replication" tab="同步策略">
          <template v-if="isRunning">
            <!-- Section: External Endpoints -->
            <div class="mb-6">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="m-0">外部仓库 (Registry Endpoints)</h4>
                <Button size="small" type="primary" @click="showEndpointForm = !showEndpointForm">
                  {{ showEndpointForm ? '取消' : '添加外部仓库' }}
                </Button>
              </div>

              <!-- Add endpoint form -->
              <div v-if="showEndpointForm" class="mb-3 rounded border border-blue-200 bg-blue-50 p-3">
                <Form layout="inline">
                  <FormItem label="名称">
                    <Input v-model:value="epForm.name" placeholder="如 Docker Hub" style="width:140px" />
                  </FormItem>
                  <FormItem label="URL">
                    <Input v-model:value="epForm.url" placeholder="https://hub.docker.com" style="width:220px" />
                  </FormItem>
                  <FormItem label="类型">
                    <Select v-model:value="epForm.type" style="width:140px">
                      <SelectOption v-for="t in endpointTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectOption>
                    </Select>
                  </FormItem>
                  <FormItem label="不安全">
                    <Switch v-model:checked="epForm.insecure" size="small" />
                  </FormItem>
                  <FormItem>
                    <Button type="primary" size="small" @click="handleCreateEndpoint">添加</Button>
                  </FormItem>
                </Form>
              </div>

              <Table :columns="endpointColumns" :data-source="endpoints" :loading="replicLoading" row-key="id" size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <Tag color="green">OK</Tag>
                  </template>
                  <template v-if="column.key === 'action'">
                    <Space>
                      <Button size="small" type="link" @click="handlePingEndpoint(record)">测试</Button>
                      <Button size="small" type="link" danger @click="handleDeleteEndpoint(record.id)">删除</Button>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>

            <!-- Section: Replication Policies -->
            <div class="mb-6">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="m-0">复制策略 (Replication Policies)</h4>
                <Button size="small" type="primary" @click="showPolicyForm = !showPolicyForm">
                  {{ showPolicyForm ? '取消' : '创建策略' }}
                </Button>
              </div>

              <!-- Create policy form -->
              <div v-if="showPolicyForm" class="mb-3 rounded border border-blue-200 bg-blue-50 p-3">
                <Form layout="vertical" class="max-w-2xl">
                  <div class="flex gap-3">
                    <FormItem label="策略名称" class="flex-1">
                      <Input v-model:value="policyForm.name" placeholder="如 sync-nginx-from-hub" />
                    </FormItem>
                    <FormItem label="源仓库" class="flex-1">
                      <Select v-model:value="policyForm.endpointId" placeholder="选择源仓库">
                        <SelectOption v-for="ep in endpoints" :key="ep.id" :value="ep.id">
                          {{ ep.name }} ({{ ep.url }})
                        </SelectOption>
                      </Select>
                    </FormItem>
                  </div>
                  <div class="flex gap-3">
                    <FormItem label="镜像名称过滤" class="flex-1">
                      <Input v-model:value="policyForm.filter" placeholder="如 library/nginx (留空匹配全部)" />
                    </FormItem>
                    <FormItem label="标签过滤" class="flex-1">
                      <Input v-model:value="policyForm.tag" placeholder="如 latest 或 1.* (留空匹配全部)" />
                    </FormItem>
                  </div>
                  <div class="flex gap-3">
                    <FormItem label="目标项目" class="flex-1">
                      <Input v-model:value="policyForm.destProject" placeholder="如 library (留空保持原路径)" />
                    </FormItem>
                    <FormItem label="定时触发 (Cron)" class="flex-1">
                      <Input v-model:value="policyForm.cron" placeholder="如 0 0 * * * (留空为手动触发)" />
                    </FormItem>
                  </div>
                  <FormItem>
                    <Button type="primary" @click="handleCreatePolicy">创建策略</Button>
                  </FormItem>
                </Form>
              </div>

              <Table :columns="policyColumns" :data-source="policies" :loading="replicLoading" row-key="id" size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'src'">
                    <Tooltip v-if="record.src_registry" :title="record.src_registry.url || ''">
                      {{ record.src_registry.name || getEndpointNameById(record.src_registry.id) }}
                    </Tooltip>
                    <span v-else>本地</span>
                  </template>
                  <template v-if="column.key === 'trigger'">
                    {{ record.trigger?.type === 'scheduled' ? '定时' : '手动' }}
                  </template>
                  <template v-if="column.key === 'enabled'">
                    <Tag :color="record.enabled ? 'green' : 'default'">{{ record.enabled ? '是' : '否' }}</Tag>
                  </template>
                  <template v-if="column.key === 'action'">
                    <Space>
                      <Button size="small" type="link" @click="handleTriggerPolicy(record.id)">执行</Button>
                      <Button size="small" type="link" @click="fetchExecutions(record.id)">历史</Button>
                      <Button size="small" type="link" danger @click="handleDeletePolicy(record.id)">删除</Button>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>

            <!-- Section: Execution History (shown when a policy is selected) -->
            <div v-if="selectedPolicyId !== null">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="m-0">执行历史 (Policy #{{ selectedPolicyId }})</h4>
                <Button size="small" @click="selectedPolicyId = null; executions = []; execTasks = []">关闭</Button>
              </div>
              <Table :columns="executionColumns" :data-source="executions" :loading="replicLoading" row-key="id" size="small">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <Tag :color="record.status === 'Succeed' ? 'green' : record.status === 'Failed' ? 'red' : 'blue'">
                      {{ record.status }}
                    </Tag>
                  </template>
                  <template v-if="column.key === 'start_time'">
                    {{ record.start_time ? record.start_time.substring(0, 19).replace('T', ' ') : '-' }}
                  </template>
                  <template v-if="column.key === 'action'">
                    <Button size="small" type="link" @click="fetchExecTasks(record.id)">详情</Button>
                  </template>
                </template>
              </Table>

              <!-- Execution Tasks -->
              <div v-if="selectedExecId !== null && execTasks.length > 0" class="mt-3">
                <h5>执行任务 (Execution #{{ selectedExecId }})</h5>
                <Table :columns="execTaskColumns" :data-source="execTasks" row-key="id" size="small">
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                      <Tag :color="record.status === 'Succeed' ? 'green' : record.status === 'Failed' ? 'red' : 'blue'">
                        {{ record.status }}
                      </Tag>
                    </template>
                    <template v-if="column.key === 'start_time'">
                      {{ record.start_time ? record.start_time.substring(0, 19).replace('T', ' ') : '-' }}
                    </template>
                  </template>
                </Table>
              </div>
            </div>
          </template>
          <p v-else class="text-gray-400">仓库未运行，无法管理同步策略。</p>
        </TabPane>

        <!-- Tab: Deploy Logs -->
        <TabPane key="logs" tab="部署日志">
          <Timeline>
            <TimelineItem
              v-for="log in deployLogs"
              :key="log.id"
              :color="logStatusColor[log.status] || 'gray'"
            >
              <p>
                <strong>{{ actionLabelMap[log.action] || log.action }}</strong>
                <Tag :color="logStatusColor[log.status]" class="ml-2">
                  {{ log.status === 'running' ? '执行中' : log.status === 'success' ? '成功' : '失败' }}
                </Tag>
              </p>
              <p class="text-xs text-gray-500">
                {{ log.startedAt }}
                <span v-if="log.finishedAt"> ~ {{ log.finishedAt }}</span>
              </p>
              <pre v-if="log.logText" class="mt-1 max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs">{{ log.logText }}</pre>
            </TimelineItem>
          </Timeline>
          <p v-if="deployLogs.length === 0" class="text-gray-400">暂无部署日志</p>
        </TabPane>

        <!-- Tab: Config -->
        <TabPane key="config" tab="配置">
          <div v-if="registry" class="max-w-lg">
            <p class="mb-4 text-gray-500">修改仓库配置后可触发升级操作</p>
            <Form layout="vertical">
              <FormItem v-if="registry.deployMode === 'k8s'" label="Helm Values">
                <Input.TextArea v-model:value="registry.helmValues" :rows="8" />
              </FormItem>
              <FormItem label="访问地址">
                <Input v-model:value="registry.endpoint" />
              </FormItem>
              <FormItem>
                <Space>
                  <Button type="primary" @click="handleUpgrade">保存并升级</Button>
                </Space>
              </FormItem>
            </Form>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
