<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Table, Button, Tag, Space, Modal, Input, Select,
  Row, Col, Statistic, message, Tooltip,
} from 'ant-design-vue';
import { getHadoopClusters, deleteHadoopCluster, checkHadoopStatus } from '../api/hadoopCluster';
import type { HadoopCluster } from '../api/types';

const router = useRouter();
const loading = ref(false);
const clusters = ref<HadoopCluster[]>([]);
const searchText = ref('');
const statusFilter = ref<string | undefined>(undefined);
const deployLog = ref('');
const logModalVisible = ref(false);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '主机', dataIndex: 'host', key: 'host', width: 150 },
  { title: '节点类型', dataIndex: 'nodeType', key: 'nodeType', width: 100 },
  { title: 'Hadoop版本', dataIndex: 'hadoopVersion', key: 'hadoopVersion', width: 110 },
  { title: '部署模式', dataIndex: 'deployMode', key: 'deployMode', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

const statusColors: Record<string, string> = {
  created: 'default', deploying: 'processing', deployed: 'cyan',
  running: 'success', stopped: 'warning', failed: 'error',
};

const nodeTypeColors: Record<string, string> = { master: 'green', node: 'blue' };

const filteredList = computed(() => {
  return clusters.value.filter((item) => {
    const matchSearch = !searchText.value ||
      item.name?.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.host?.toLowerCase().includes(searchText.value.toLowerCase());
    const matchStatus = !statusFilter.value || item.status === statusFilter.value;
    return matchSearch && matchStatus;
  });
});

const stats = computed(() => {
  const all = clusters.value;
  return {
    total: all.length,
    masters: all.filter((i) => i.nodeType === 'master').length,
    nodes: all.filter((i) => i.nodeType === 'node').length,
    running: all.filter((i) => i.status === 'running' || i.status === 'deployed').length,
  };
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getHadoopClusters();
    clusters.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取Hadoop集群列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goDeploy() { router.push('/CLM/hadoop/deploy'); }

async function handleCheckStatus(record: HadoopCluster) {
  try {
    await checkHadoopStatus(record.id);
    message.success('状态已刷新');
    fetchList();
  } catch (e: any) { message.error('状态检查失败: ' + e.message); }
}

function handleShowLog(record: HadoopCluster) {
  deployLog.value = record.deployLog || '暂无部署日志';
  logModalVisible.value = true;
}

function handleDelete(record: HadoopCluster) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除Hadoop节点「${record.name}」吗？该操作不可恢复。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteHadoopCluster(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card><Statistic title="节点总数" :value="stats.total" :value-style="{ color: '#1890ff' }" /></Card>
      </Col>
      <Col :span="6">
        <Card><Statistic title="Master" :value="stats.masters" :value-style="{ color: '#52c41a' }" /></Card>
      </Col>
      <Col :span="6">
        <Card><Statistic title="Node" :value="stats.nodes" :value-style="{ color: '#722ed1' }" /></Card>
      </Col>
      <Col :span="6">
        <Card><Statistic title="运行中" :value="stats.running" :value-style="{ color: '#13c2c2' }" /></Card>
      </Col>
    </Row>

    <!-- 列表 -->
    <Card title="Hadoop 集群管理">
      <template #extra>
        <Space>
          <Input v-model:value="searchText" placeholder="搜索名称 / 主机" allow-clear style="width: 200px" />
          <Select v-model:value="statusFilter" placeholder="状态筛选" allow-clear style="width: 120px">
            <Select.Option value="created">已创建</Select.Option>
            <Select.Option value="deploying">部署中</Select.Option>
            <Select.Option value="deployed">已部署</Select.Option>
            <Select.Option value="running">运行中</Select.Option>
            <Select.Option value="stopped">已停止</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
          <Button @click="fetchList">刷新</Button>
          <Button type="primary" @click="goDeploy">部署节点</Button>
        </Space>
      </template>

      <Table
        :columns="columns" :data-source="filteredList" :loading="loading" row-key="id"
        :scroll="{ x: 1200 }" :pagination="{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'nodeType'">
            <Tag :color="nodeTypeColors[record.nodeType] || 'default'">{{ record.nodeType }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColors[record.status] || 'default'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Tooltip title="刷新状态">
                <Button type="link" size="small" @click="handleCheckStatus(record)">状态</Button>
              </Tooltip>
              <Button type="link" size="small" @click="handleShowLog(record)">日志</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 日志弹窗 -->
    <Modal v-model:open="logModalVisible" title="部署日志" width="70%" :footer="null">
      <pre style="max-height: 500px; overflow: auto; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; font-size: 13px; line-height: 1.5">{{ deployLog }}</pre>
    </Modal>
  </div>
</template>
