<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
} from 'ant-design-vue';
import {
  getRedisInstances,
  deleteRedisInstance,
  checkRedisStatus,
  startRedis,
  stopRedis,
  restartRedis,
} from '../api/redisInstance';
import type { RedisInstance } from '../api/types';

const router = useRouter();
const loading = ref(false);
const instances = ref<RedisInstance[]>([]);
const searchText = ref('');
const statusFilter = ref<string | undefined>(undefined);
const deployLog = ref('');
const logModalVisible = ref(false);

const columns = [
  { title: '实例名称', dataIndex: 'instanceName', key: 'instanceName', ellipsis: true },
  { title: '主机', dataIndex: 'host', key: 'host', width: 150 },
  { title: '端口', dataIndex: 'redisPort', key: 'redisPort', width: 80 },
  { title: '版本', dataIndex: 'redisVersion', key: 'redisVersion', width: 80 },
  { title: '部署模式', dataIndex: 'deployMode', key: 'deployMode', width: 100 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 90 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

const statusColors: Record<string, string> = {
  pending: 'default',
  deploying: 'processing',
  deployed: 'cyan',
  running: 'success',
  stopped: 'warning',
  failed: 'error',
};

const modeColors: Record<string, string> = {
  standalone: 'blue',
  sentinel: 'purple',
  cluster: 'volcano',
};

const roleColors: Record<string, string> = {
  master: 'green',
  slave: 'orange',
  sentinel: 'purple',
};

const filteredList = computed(() => {
  return instances.value.filter((item) => {
    const matchSearch =
      !searchText.value ||
      item.instanceName?.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.host?.toLowerCase().includes(searchText.value.toLowerCase());
    const matchStatus = !statusFilter.value || item.status === statusFilter.value;
    return matchSearch && matchStatus;
  });
});

const stats = computed(() => {
  const all = instances.value;
  return {
    total: all.length,
    running: all.filter((i) => i.status === 'running').length,
    stopped: all.filter((i) => i.status === 'stopped').length,
    failed: all.filter((i) => i.status === 'failed').length,
  };
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getRedisInstances();
    instances.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取Redis实例列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goDeploy() {
  router.push('/CLM/redis/deploy');
}

async function handleCheckStatus(record: RedisInstance) {
  try {
    await checkRedisStatus(record.id);
    message.success('状态已刷新');
    fetchList();
  } catch (e: any) {
    message.error('状态检查失败: ' + e.message);
  }
}

async function handleStart(record: RedisInstance) {
  try {
    const res = await startRedis(record.id);
    message.success((res as any)?.message || '启动成功');
    fetchList();
  } catch (e: any) {
    message.error('启动失败: ' + e.message);
  }
}

async function handleStop(record: RedisInstance) {
  Modal.confirm({
    title: '确认停止',
    content: `确定要停止Redis实例「${record.instanceName}」吗？`,
    async onOk() {
      try {
        const res = await stopRedis(record.id);
        message.success((res as any)?.message || '已停止');
        fetchList();
      } catch (e: any) {
        message.error('停止失败: ' + e.message);
      }
    },
  });
}

async function handleRestart(record: RedisInstance) {
  try {
    const res = await restartRedis(record.id);
    message.success((res as any)?.message || '重启成功');
    fetchList();
  } catch (e: any) {
    message.error('重启失败: ' + e.message);
  }
}

function handleShowLog(record: RedisInstance) {
  deployLog.value = record.deployLog || '暂无部署日志';
  logModalVisible.value = true;
}

function handleDelete(record: RedisInstance) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除Redis实例「${record.instanceName}」吗？该操作不可恢复。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRedisInstance(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="p-4">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic title="实例总数" :value="stats.total" :value-style="{ color: '#1890ff' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="运行中" :value="stats.running" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="已停止" :value="stats.stopped" :value-style="{ color: '#faad14' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="失败" :value="stats.failed" :value-style="{ color: '#ff4d4f' }" />
        </Card>
      </Col>
    </Row>

    <!-- 列表 -->
    <Card title="Redis 实例管理">
      <template #extra>
        <Space>
          <Input
            v-model:value="searchText"
            placeholder="搜索实例名 / 主机"
            allow-clear
            style="width: 200px"
          />
          <Select
            v-model:value="statusFilter"
            placeholder="状态筛选"
            allow-clear
            style="width: 120px"
          >
            <Select.Option value="pending">待部署</Select.Option>
            <Select.Option value="deploying">部署中</Select.Option>
            <Select.Option value="deployed">已部署</Select.Option>
            <Select.Option value="running">运行中</Select.Option>
            <Select.Option value="stopped">已停止</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
          <Button @click="fetchList">刷新</Button>
          <Button type="primary" @click="goDeploy">部署新实例</Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="filteredList"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1300 }"
        :pagination="{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deployMode'">
            <Tag :color="modeColors[record.deployMode] || 'default'">{{ record.deployMode }}</Tag>
          </template>
          <template v-if="column.key === 'role'">
            <Tag :color="roleColors[record.role] || 'default'">{{ record.role }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColors[record.status] || 'default'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Tooltip title="刷新状态">
                <Button type="link" size="small" @click="handleCheckStatus(record)">状态</Button>
              </Tooltip>
              <Button
                v-if="record.status === 'stopped' || record.status === 'deployed'"
                type="link"
                size="small"
                @click="handleStart(record)"
              >
                启动
              </Button>
              <Button
                v-if="record.status === 'running'"
                type="link"
                size="small"
                @click="handleStop(record)"
              >
                停止
              </Button>
              <Button
                v-if="record.status === 'running'"
                type="link"
                size="small"
                @click="handleRestart(record)"
              >
                重启
              </Button>
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
