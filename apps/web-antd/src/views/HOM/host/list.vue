<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Button, Tag, Space, Modal, Progress, message } from 'ant-design-vue';
import { getHosts, deleteHost } from '../api/host';
import type { Host } from '../api/types';

const router = useRouter();
const loading = ref(false);
const hosts = ref<Host[]>([]);

const columns = [
  { title: '主机名', dataIndex: 'hostname', key: 'hostname' },
  { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
  { title: '机架', dataIndex: 'rack', key: 'rack', width: 80 },
  { title: 'CPU', key: 'cpu', width: 120 },
  { title: '内存', key: 'mem', width: 120 },
  { title: '磁盘', key: 'disk', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'Agent', dataIndex: 'agentStatus', key: 'agentStatus', width: 120 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  online: 'green',
  offline: 'default',
  error: 'red',
  unknown: 'orange',
};

const agentColorMap: Record<string, string> = {
  running: 'green',
  stopped: 'red',
  installing: 'blue',
  not_installed: 'default',
};

function cpuPercent(record: Host) {
  return record.cpuUsage ? Number(record.cpuUsage) : 0;
}

function memPercent(record: Host) {
  if (!record.totalMemGb || record.totalMemGb === 0) return 0;
  return Math.round((Number(record.usedMemGb) / Number(record.totalMemGb)) * 100);
}

function diskPercent(record: Host) {
  if (!record.totalDiskGb || record.totalDiskGb === 0) return 0;
  return Math.round((Number(record.usedDiskGb) / Number(record.totalDiskGb)) * 100);
}

async function fetchHosts() {
  loading.value = true;
  try {
    const res = await getHosts();
    hosts.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取主机列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goAdd() {
  router.push('/HOM/host/add');
}

function goDetail(record: Host) {
  router.push(`/HOM/host/detail/${record.id}`);
}

function handleDelete(record: Host) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除主机「${record.hostname}」(${record.ipAddress}) 吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteHost(record.id);
        message.success('删除成功');
        fetchHosts();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => {
  fetchHosts();
});
</script>

<template>
  <div class="p-4">
    <Card title="主机列表">
      <template #extra>
        <Button type="primary" @click="goAdd">添加主机</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="hosts"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cpu'">
            <Progress :percent="cpuPercent(record)" size="small" :stroke-color="cpuPercent(record) > 80 ? '#ff4d4f' : '#52c41a'" />
          </template>
          <template v-if="column.key === 'mem'">
            <Progress :percent="memPercent(record)" size="small" :stroke-color="memPercent(record) > 80 ? '#ff4d4f' : '#1890ff'" />
          </template>
          <template v-if="column.key === 'disk'">
            <Progress :percent="diskPercent(record)" size="small" :stroke-color="diskPercent(record) > 80 ? '#ff4d4f' : '#faad14'" />
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'agentStatus'">
            <Tag :color="agentColorMap[record.agentStatus] || 'default'">{{ record.agentStatus }}</Tag>
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
