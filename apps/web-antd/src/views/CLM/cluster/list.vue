<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Button, Tag, Space, Modal, message } from 'ant-design-vue';
import { getClusters, deleteCluster } from '../api/cluster';
import type { Cluster } from '../api/types';

const router = useRouter();
const loading = ref(false);
const clusters = ref<Cluster[]>([]);

const columns = [
  { title: '集群名称', dataIndex: 'clusterName', key: 'clusterName' },
  { title: '集群编码', dataIndex: 'clusterCode', key: 'clusterCode' },
  { title: '类型', dataIndex: 'clusterType', key: 'clusterType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '主机数', dataIndex: 'totalHosts', key: 'totalHosts', width: 80 },
  { title: '运行服务', dataIndex: 'runningServices', key: 'runningServices', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  running: 'green',
  inactive: 'default',
  configuring: 'blue',
  error: 'red',
  stopped: 'orange',
};

async function fetchClusters() {
  loading.value = true;
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取集群列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goCreate() {
  router.push('/CLM/cluster/create');
}

function goDetail(record: Cluster) {
  router.push(`/CLM/cluster/detail/${record.id}`);
}

function handleDelete(record: Cluster) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除集群「${record.clusterName}」吗？该操作不可恢复。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteCluster(record.id);
        message.success('删除成功');
        fetchClusters();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => {
  fetchClusters();
});
</script>

<template>
  <div class="p-4">
    <Card title="集群列表">
      <template #extra>
        <Button type="primary" @click="goCreate">创建集群</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="clusters"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">
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
