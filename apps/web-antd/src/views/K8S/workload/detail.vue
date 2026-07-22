<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Descriptions,
  DescriptionsItem,
  Tag,
  Table,
  Tabs,
  TabPane,
  Button,
  Space,
  Modal,
  InputNumber,
  Spin,
  message,
} from 'ant-design-vue';
import { h } from 'vue';
import {
  getDeployment, scaleDeployment, restartDeployment, getDeploymentRevisions, rollbackDeployment,
  getStatefulSet, scaleStatefulSet, restartStatefulSet,
  getDaemonSet, restartDaemonSet,
} from '../api/workload';
import { getPods } from '../api/pod';
import YamlEditor from '../components/YamlEditor.vue';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const namespace = route.params.namespace as string;
const kind = route.params.kind as string;
const name = route.params.name as string;

const loading = ref(true);
const workload = ref<any>(null);
const revisions = ref<any[]>([]);
const workloadPods = ref<any[]>([]);
const activeTab = ref('info');

const containerColumns = [
  { title: '容器名', dataIndex: 'name', key: 'name' },
  { title: '镜像', dataIndex: 'image', key: 'image', ellipsis: true },
  { title: '端口', key: 'ports', width: 180 },
  { title: '资源请求', key: 'requests', width: 200 },
  { title: '资源限制', key: 'limits', width: 200 },
];

const revisionColumns = [
  { title: '版本', dataIndex: 'revision', key: 'revision', width: 80 },
  { title: 'ReplicaSet', dataIndex: 'name', key: 'name' },
  { title: '副本', key: 'replicas', width: 100 },
  { title: '镜像', key: 'images', ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100 },
];

async function fetchData() {
  loading.value = true;
  try {
    if (kind === 'Deployment') {
      const [workloadRes, revisionsRes] = await Promise.all([
        getDeployment(clusterId, namespace, name),
        getDeploymentRevisions(clusterId, namespace, name),
      ]);
      workload.value = workloadRes;
      revisions.value = Array.isArray(revisionsRes) ? revisionsRes : [];
    } else if (kind === 'StatefulSet') {
      workload.value = await getStatefulSet(clusterId, namespace, name);
    } else if (kind === 'DaemonSet') {
      workload.value = await getDaemonSet(clusterId, namespace, name);
    }
  } catch (e: any) {
    message.error('获取工作负载信息失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push(`/K8S/workload/list?clusterId=${clusterId}&namespace=${namespace}`);
}

function goPodDetail(record: any) {
  router.push(`/K8S/pod/detail/${clusterId}/${namespace}/${record.name}`);
}

const workloadPodColumns = [
  { title: 'Pod名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '就绪', dataIndex: 'ready', key: 'ready', width: 80 },
  { title: '重启', dataIndex: 'restarts', key: 'restarts', width: 80 },
  { title: '节点', dataIndex: 'nodeName', key: 'nodeName', width: 160 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
];

async function fetchPods() {
  try {
    const res = await getPods(clusterId, namespace);
    const all = Array.isArray(res) ? res : [];
    workloadPods.value = all.filter((p: any) =>
      p.ownerReferences?.some((o: any) => o.name === name || o.name?.startsWith(name + '-')),
    );
  } catch { /* ignore */ }
}

function handleScale() {
  let newReplicas = workload.value?.replicas || 0;
  Modal.confirm({
    title: `伸缩 ${name}`,
    content: () => h(InputNumber, {
      min: 0, max: 100, value: newReplicas,
      'onUpdate:value': (val: number) => { newReplicas = val; },
      style: { width: '100%' },
    }),
    async onOk() {
      try {
        if (kind === 'Deployment') {
          await scaleDeployment(clusterId, namespace, name, newReplicas);
        } else if (kind === 'StatefulSet') {
          await scaleStatefulSet(clusterId, namespace, name, newReplicas);
        }
        message.success('伸缩成功');
        fetchData();
      } catch (e: any) {
        message.error('伸缩失败: ' + e.message);
      }
    },
  });
}

function handleRestart() {
  Modal.confirm({
    title: '确认重启',
    content: `确定要滚动重启「${name}」吗？`,
    async onOk() {
      try {
        if (kind === 'Deployment') {
          await restartDeployment(clusterId, namespace, name);
        } else if (kind === 'StatefulSet') {
          await restartStatefulSet(clusterId, namespace, name);
        } else if (kind === 'DaemonSet') {
          await restartDaemonSet(clusterId, namespace, name);
        }
        message.success('重启成功');
        fetchData();
      } catch (e: any) {
        message.error('重启失败: ' + e.message);
      }
    },
  });
}

function handleRollback(revision: number) {
  Modal.confirm({
    title: '确认回滚',
    content: `确定要回滚到版本 ${revision} 吗？`,
    async onOk() {
      try {
        await rollbackDeployment(clusterId, namespace, name, revision);
        message.success('回滚成功');
        fetchData();
      } catch (e: any) {
        message.error('回滚失败: ' + e.message);
      }
    },
  });
}

function formatResources(resources: any, type: string): string {
  if (!resources || !resources[type]) return '-';
  const r = resources[type];
  const parts: string[] = [];
  if (r.cpu) parts.push(`CPU: ${r.cpu}`);
  if (r.memory) parts.push(`内存: ${r.memory}`);
  return parts.join(', ') || '-';
}

onMounted(() => { fetchData(); fetchPods(); });
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- 顶部 -->
      <Card class="mb-4">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0;">
              <Tag color="blue">{{ kind }}</Tag>
              {{ name }}
            </h2>
            <Space class="mt-1">
              <Tag :color="workload?.status === 'Running' ? 'green' : 'orange'">
                {{ workload?.status || '-' }}
              </Tag>
              <a style="color: #8c8c8c;" @click="router.push(`/K8S/namespace/detail/${clusterId}/${namespace}`)">{{ namespace }}</a>
            </Space>
          </div>
          <Space>
            <Button v-if="kind !== 'DaemonSet'" @click="handleScale">伸缩</Button>
            <Button @click="handleRestart">重启</Button>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <!-- 基本信息 -->
        <TabPane key="info" tab="基本信息">
          <Card title="属性" class="mb-4">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ workload?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ workload?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="类型">{{ workload?.kind }}</DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="workload?.status === 'Running' ? 'green' : 'orange'">{{ workload?.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem v-if="kind !== 'DaemonSet'" label="副本数">
                {{ workload?.readyReplicas || 0 }} / {{ workload?.replicas || 0 }}
              </DescriptionsItem>
              <DescriptionsItem v-if="workload?.strategy" label="策略">{{ workload.strategy }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ workload?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>

          <!-- 容器信息 -->
          <Card v-if="workload?.containers" title="容器" class="mb-4">
            <Table
              :columns="containerColumns"
              :data-source="workload.containers"
              :pagination="false"
              row-key="name"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'ports'">
                  <span v-if="record.ports && record.ports.length > 0">
                    <Tag v-for="(p, idx) in record.ports" :key="idx" size="small">
                      {{ p.containerPort }}/{{ p.protocol || 'TCP' }}
                    </Tag>
                  </span>
                  <span v-else>-</span>
                </template>
                <template v-if="column.key === 'requests'">
                  {{ formatResources(record.resources, 'requests') }}
                </template>
                <template v-if="column.key === 'limits'">
                  {{ formatResources(record.resources, 'limits') }}
                </template>
              </template>
            </Table>
          </Card>

          <!-- 标签 -->
          <Card v-if="workload?.labels" title="标签 (Labels)" class="mb-4">
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <Tag v-for="(value, key) in workload.labels" :key="key" color="blue">
                {{ key }}={{ value }}
              </Tag>
            </div>
          </Card>
        </TabPane>

        <!-- 修订历史（仅Deployment） -->
        <TabPane v-if="kind === 'Deployment'" key="revisions" :tab="`修订记录 (${revisions.length})`">
          <Card>
            <Table
              :columns="revisionColumns"
              :data-source="revisions"
              :pagination="false"
              row-key="revision"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'replicas'">
                  {{ record.readyReplicas || 0 }}/{{ record.replicas || 0 }}
                </template>
                <template v-if="column.key === 'images'">
                  <Tag v-for="(img, idx) in (record.images || [])" :key="idx" size="small" style="margin: 2px;">
                    {{ img.split('/').pop() }}
                  </Tag>
                </template>
                <template v-if="column.key === 'action'">
                  <Button type="link" size="small" @click="handleRollback(record.revision)">回滚</Button>
                </template>
              </template>
            </Table>
          </Card>
        </TabPane>

        <!-- Pod列表 -->
        <TabPane key="pods" :tab="`Pod列表 (${workloadPods.length})`">
          <Card>
            <Table :columns="workloadPodColumns" :data-source="workloadPods" :pagination="false" row-key="name" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a @click="goPodDetail(record)">{{ record.name }}</a>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="record.status === 'Running' ? 'green' : record.status === 'Succeeded' ? 'blue' : 'red'">
                    {{ record.status }}
                  </Tag>
                </template>
              </template>
            </Table>
          </Card>
        </TabPane>

        <!-- YAML -->
        <TabPane key="yaml" tab="YAML">
          <Card>
            <YamlEditor :model-value="workload?.yaml || ''" :read-only="true" height="600px" />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
