<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  message,
} from 'ant-design-vue';
import { getPods, deletePod } from '../api/pod';
import K8sSelector from '../components/K8sSelector.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const selectedClusterId = ref<number | null>(
  route.query.clusterId ? Number(route.query.clusterId) : null,
);
const selectedNamespace = ref<string>(
  (route.query.namespace as string) || '',
);
const pods = ref<any[]>([]);

const columns = [
  { title: 'Pod名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '就绪', dataIndex: 'ready', key: 'ready', width: 80 },
  { title: '重启', dataIndex: 'restarts', key: 'restarts', width: 70 },
  { title: '节点', dataIndex: 'nodeName', key: 'nodeName', width: 140 },
  { title: 'IP', dataIndex: 'podIP', key: 'podIP', width: 130 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  Running: 'green',
  Succeeded: 'blue',
  Pending: 'orange',
  Failed: 'red',
  Unknown: 'default',
};

async function fetchPods() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getPods(selectedClusterId.value, selectedNamespace.value);
    pods.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取Pod列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goDetail(record: any) {
  router.push(`/K8S/pod/detail/${selectedClusterId.value}/${record.namespace}/${record.name}`);
}

function handleDelete(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除Pod「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deletePod(selectedClusterId.value!, record.namespace, record.name);
        message.success('删除成功');
        fetchPods();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="容器组 (Pod)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchPods" />
          <Button @click="fetchPods">刷新</Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="pods"
        :loading="loading"
        row-key="name"
        :scroll="{ x: 1200 }"
        :pagination="{ pageSize: 20 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="goDetail(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'restarts'">
            <span :style="{ color: record.restarts > 0 ? '#fa541c' : '#52c41a' }">{{ record.restarts }}</span>
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
