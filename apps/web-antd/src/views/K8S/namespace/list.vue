<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  SelectOption,
  Modal,
  message,
} from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getNamespaces, deleteNamespace } from '../api/namespace';
import type { K8sCluster } from '../api/types';

const router = useRouter();
const loading = ref(false);
const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const namespaces = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'Pod数', dataIndex: 'podCount', key: 'podCount', width: 80 },
  { title: 'Deployments', dataIndex: 'deploymentCount', key: 'deploymentCount', width: 120 },
  { title: 'Services', dataIndex: 'serviceCount', key: 'serviceCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter((c) => c.status === 'active');
    if (active.length > 0 && !selectedClusterId.value) {
      selectedClusterId.value = active[0]!.id;
      fetchNamespaces();
    }
  } catch (e: any) {
    message.error('获取集群列表失败');
  }
}

async function fetchNamespaces() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getNamespaces(selectedClusterId.value);
    namespaces.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取命名空间列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleClusterChange(value: number) {
  selectedClusterId.value = value;
  fetchNamespaces();
}

function goCreate() {
  router.push(`/K8S/namespace/create?clusterId=${selectedClusterId.value}`);
}

function goDetail(record: any) {
  router.push(`/K8S/namespace/detail/${selectedClusterId.value}/${record.name}`);
}

function handleDelete(record: any) {
  if (['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(record.name)) {
    message.warning('系统命名空间不可删除');
    return;
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除命名空间「${record.name}」吗？该操作将删除该命名空间下的所有资源，不可恢复。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteNamespace(selectedClusterId.value!, record.name);
        message.success('删除成功');
        fetchNamespaces();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="命名空间管理">
      <template #extra>
        <Space>
          <span style="color: #8c8c8c;">选择集群:</span>
          <Select
            :value="selectedClusterId"
            style="width: 200px;"
            placeholder="选择集群"
            @change="handleClusterChange"
          >
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">
              {{ c.name }}
              <Tag v-if="c.status === 'active'" color="green" size="small" class="ml-1">运行中</Tag>
            </SelectOption>
          </Select>
          <Button @click="fetchNamespaces">刷新</Button>
          <Button type="primary" @click="goCreate">创建命名空间</Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="namespaces"
        :loading="loading"
        row-key="name"
        :scroll="{ x: 900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="goDetail(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'Active' ? 'green' : 'red'">
              {{ record.status }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="goDetail(record)">详情</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
