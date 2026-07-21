<script lang="ts" setup>
import { h, nextTick, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Tabs,
  TabPane,
  Modal,
  InputNumber,
  message,
} from 'ant-design-vue';
import {
  getDeployments, deleteDeployment, scaleDeployment, restartDeployment,
  getStatefulSets, deleteStatefulSet, scaleStatefulSet, restartStatefulSet,
  getDaemonSets, deleteDaemonSet, restartDaemonSet,
} from '../api/workload';
import K8sSelector from '../components/K8sSelector.vue';
import { getDemoWorkloads } from '../demo-data';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const selectedClusterId = ref<number | null>(route.query.clusterId ? Number(route.query.clusterId) : null);
const selectedNamespace = ref<string>((route.query.namespace as string) || '');
const activeTab = ref('deployment');
const selectorRef = ref<{ isDemoSelection: () => boolean } | null>(null);

const deployments = ref<any[]>([]);
const statefulSets = ref<any[]>([]);
const daemonSets = ref<any[]>([]);

const workloadColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
  { title: '状态', key: 'status', width: 100 },
  { title: '副本', key: 'replicas', width: 120 },
  { title: '镜像', key: 'images', ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

async function fetchWorkloads() {
  await nextTick();
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  if (selectorRef.value?.isDemoSelection()) {
    const demo = getDemoWorkloads(selectedNamespace.value);
    deployments.value = demo.deployments;
    statefulSets.value = demo.statefulSets;
    daemonSets.value = demo.daemonSets;
    return;
  }
  loading.value = true;
  try {
    const cid = selectedClusterId.value;
    const ns = selectedNamespace.value;
    const [depRes, stsRes, dsRes] = await Promise.all([
      getDeployments(cid, ns),
      getStatefulSets(cid, ns),
      getDaemonSets(cid, ns),
    ]);
    deployments.value = Array.isArray(depRes) ? depRes : [];
    statefulSets.value = Array.isArray(stsRes) ? stsRes : [];
    daemonSets.value = Array.isArray(dsRes) ? dsRes : [];
    if (
      deployments.value.length === 0 &&
      statefulSets.value.length === 0 &&
      daemonSets.value.length === 0 &&
      selectorRef.value?.isDemoSelection()
    ) {
      const demo = getDemoWorkloads(ns);
      deployments.value = demo.deployments;
      statefulSets.value = demo.statefulSets;
      daemonSets.value = demo.daemonSets;
    }
  } catch (e: any) {
    message.error('获取工作负载失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goCreate() {
  if (isDemoSelection()) return;
  router.push(`/K8S/workload/create?clusterId=${selectedClusterId.value}&namespace=${selectedNamespace.value}&kind=${activeTab.value}`);
}

function goDetail(record: any) {
  if (isDemoSelection()) return;
  router.push(`/K8S/workload/detail/${selectedClusterId.value}/${record.namespace}/${record.kind}/${record.name}`);
}

function handleScale(record: any) {
  if (isDemoSelection()) return;
  let newReplicas = record.replicas;
  Modal.confirm({
    title: `伸缩 ${record.name}`,
    content: () => {
      return h(InputNumber, {
        min: 0,
        max: 100,
        value: newReplicas,
        'onUpdate:value': (val: number) => { newReplicas = val; },
        style: { width: '100%' },
      });
    },
    async onOk() {
      try {
        const cid = selectedClusterId.value!;
        if (record.kind === 'Deployment') {
          await scaleDeployment(cid, record.namespace, record.name, newReplicas);
        } else if (record.kind === 'StatefulSet') {
          await scaleStatefulSet(cid, record.namespace, record.name, newReplicas);
        }
        message.success('伸缩成功');
        fetchWorkloads();
      } catch (e: any) {
        message.error('伸缩失败: ' + e.message);
      }
    },
  });
}

function handleRestart(record: any) {
  if (isDemoSelection()) return;
  Modal.confirm({
    title: '确认重启',
    content: `确定要滚动重启「${record.name}」吗？`,
    async onOk() {
      try {
        const cid = selectedClusterId.value!;
        if (record.kind === 'Deployment') {
          await restartDeployment(cid, record.namespace, record.name);
        } else if (record.kind === 'StatefulSet') {
          await restartStatefulSet(cid, record.namespace, record.name);
        } else if (record.kind === 'DaemonSet') {
          await restartDaemonSet(cid, record.namespace, record.name);
        }
        message.success('重启成功');
        fetchWorkloads();
      } catch (e: any) {
        message.error('重启失败: ' + e.message);
      }
    },
  });
}

function handleDelete(record: any) {
  if (isDemoSelection()) return;
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除${record.kind}「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        const cid = selectedClusterId.value!;
        if (record.kind === 'Deployment') {
          await deleteDeployment(cid, record.namespace, record.name);
        } else if (record.kind === 'StatefulSet') {
          await deleteStatefulSet(cid, record.namespace, record.name);
        } else if (record.kind === 'DaemonSet') {
          await deleteDaemonSet(cid, record.namespace, record.name);
        }
        message.success('删除成功');
        fetchWorkloads();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

function isDemoSelection() {
  if (selectorRef.value?.isDemoSelection()) {
    message.info('演示集群资源为只读展示');
    return true;
  }
  return false;
}

</script>

<template>
  <div class="p-4">
    <Card title="工作负载">
      <template #extra>
        <Space>
          <K8sSelector ref="selectorRef" v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchWorkloads" />
          <Button @click="fetchWorkloads">刷新</Button>
          <Button type="primary" @click="goCreate">创建工作负载</Button>
        </Space>
      </template>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="deployment" :tab="`Deployments (${deployments.length})`">
          <Table
            :columns="workloadColumns"
            :data-source="deployments"
            :loading="loading"
            row-key="name"
            :scroll="{ x: 1100 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a @click="goDetail(record)">{{ record.name }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="record.status === 'Running' ? 'green' : 'orange'">{{ record.status }}</Tag>
              </template>
              <template v-if="column.key === 'replicas'">
                <span>{{ record.readyReplicas || 0 }}/{{ record.replicas || 0 }}</span>
              </template>
              <template v-if="column.key === 'images'">
                <Tag v-for="(img, idx) in (record.images || [])" :key="idx" size="small" style="margin: 2px;">
                  {{ img.split('/').pop() }}
                </Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="goDetail(record)">详情</Button>
                  <Button type="link" size="small" @click="handleScale(record)">伸缩</Button>
                  <Button type="link" size="small" @click="handleRestart(record)">重启</Button>
                  <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="statefulset" :tab="`StatefulSets (${statefulSets.length})`">
          <Table
            :columns="workloadColumns"
            :data-source="statefulSets"
            :loading="loading"
            row-key="name"
            :scroll="{ x: 1100 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a @click="goDetail(record)">{{ record.name }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="record.status === 'Running' ? 'green' : 'orange'">{{ record.status }}</Tag>
              </template>
              <template v-if="column.key === 'replicas'">
                <span>{{ record.readyReplicas || 0 }}/{{ record.replicas || 0 }}</span>
              </template>
              <template v-if="column.key === 'images'">
                <Tag v-for="(img, idx) in (record.images || [])" :key="idx" size="small" style="margin: 2px;">
                  {{ img.split('/').pop() }}
                </Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="goDetail(record)">详情</Button>
                  <Button type="link" size="small" @click="handleScale(record)">伸缩</Button>
                  <Button type="link" size="small" @click="handleRestart(record)">重启</Button>
                  <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="daemonset" :tab="`DaemonSets (${daemonSets.length})`">
          <Table
            :columns="workloadColumns.filter(c => c.key !== 'replicas')"
            :data-source="daemonSets"
            :loading="loading"
            row-key="name"
            :scroll="{ x: 1000 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a @click="goDetail(record)">{{ record.name }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="record.status === 'Running' ? 'green' : 'orange'">{{ record.status }}</Tag>
              </template>
              <template v-if="column.key === 'images'">
                <Tag v-for="(img, idx) in (record.images || [])" :key="idx" size="small" style="margin: 2px;">
                  {{ img.split('/').pop() }}
                </Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="goDetail(record)">详情</Button>
                  <Button type="link" size="small" @click="handleRestart(record)">重启</Button>
                  <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
