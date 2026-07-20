<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Card, Table, Button, Tag, Space, Modal, Progress, message,
  Select, SelectOption,
} from 'ant-design-vue';
import { getCommands, getCommandDetail, cancelCommand } from '../api/command';
import { getClusters } from '../../CLM/api/cluster';
import type { Command, CommandHost, CommandHostRole } from '../api/types';
import type { Cluster } from '../../CLM/api/types';

const loading = ref(false);
const commands = ref<Command[]>([]);
const clusters = ref<Cluster[]>([]);
const selectedClusterId = ref<number | undefined>(undefined);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const columns = [
  { title: '指令名称', dataIndex: 'commandName', key: 'commandName' },
  { title: '类型', dataIndex: 'commandType', key: 'commandType', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '进度', key: 'progress', width: 150 },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  pending: 'default', running: 'blue', success: 'green',
  failed: 'red', cancelled: 'orange',
};

const statusLabelMap: Record<string, string> = {
  pending: '等待中', running: '执行中', success: '成功',
  failed: '失败', cancelled: '已取消',
};

const typeColorMap: Record<string, string> = {
  install: 'blue', start: 'green', stop: 'orange',
  restart: 'cyan', config_update: 'purple',
};

const typeLabelMap: Record<string, string> = {
  install: '安装', start: '启动', stop: '停止',
  restart: '重启', config_update: '配置更新',
};

// Detail modal
const detailVisible = ref(false);
const detailTitle = ref('');
const detailHosts = ref<CommandHost[]>([]);
const detailLoading = ref(false);

const hostColumns = [
  { title: '主机名', dataIndex: 'hostname', key: 'hostname' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '进度', key: 'progress', width: 150 },
  { title: '结果', dataIndex: 'resultMsg', key: 'resultMsg', ellipsis: true },
];

const roleColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色类型', dataIndex: 'roleType', key: 'roleType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '结果', dataIndex: 'resultMsg', key: 'resultMsg', ellipsis: true },
  { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt', width: 170 },
  { title: '结束时间', dataIndex: 'finishedAt', key: 'finishedAt', width: 170 },
];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function fetchCommands() {
  loading.value = true;
  try {
    const res = await getCommands(selectedClusterId.value);
    commands.value = Array.isArray(res) ? res : [];
    // Auto-refresh if there are active commands
    const hasActive = commands.value.some(c => c.status === 'pending' || c.status === 'running');
    if (hasActive) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  } catch (e: any) {
    message.error('获取指令列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function onClusterChange(value: any) {
  selectedClusterId.value = value;
  fetchCommands();
}

async function showDetail(record: Command) {
  detailTitle.value = `指令详情 - ${record.commandName}`;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const res = await getCommandDetail(record.id);
    const hosts = Array.isArray(res?.hosts) ? res.hosts : [];
    // Ensure each host has a roles array
    detailHosts.value = hosts.map((h: any) => ({
      ...h,
      roles: Array.isArray(h.roles) ? h.roles : [],
    }));
  } catch (e: any) {
    message.error('获取指令详情失败: ' + e.message);
  } finally {
    detailLoading.value = false;
  }
}

function handleCancel(record: Command) {
  Modal.confirm({
    title: '确认取消',
    content: `确定要取消指令「${record.commandName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await cancelCommand(record.id);
        message.success('取消命令已发送');
        fetchCommands();
      } catch (e: any) {
        message.error('取消失败: ' + e.message);
      }
    },
  });
}

// Auto-refresh when there are active commands
function startAutoRefresh() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    const hasActive = commands.value.some(c => c.status === 'pending' || c.status === 'running');
    if (hasActive) {
      fetchCommandsSilent();
    } else {
      stopAutoRefresh();
    }
  }, 3000);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

async function fetchCommandsSilent() {
  try {
    const res = await getCommands(selectedClusterId.value);
    commands.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

onMounted(() => {
  fetchClusters();
  fetchCommands();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="p-4">
    <Card title="指令中心">
      <template #extra>
        <Space>
          <Select
            v-model:value="selectedClusterId"
            placeholder="选择集群"
            style="width: 200px"
            allow-clear
            @change="onClusterChange"
          >
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">
              {{ c.clusterName }}
            </SelectOption>
          </Select>
          <Button @click="fetchCommands">刷新</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="commands"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'commandType'">
            <Tag :color="typeColorMap[(_record as any).commandType] || 'default'">
              {{ typeLabelMap[(_record as any).commandType] || (_record as any).commandType }}
            </Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">
              {{ statusLabelMap[(_record as any).status] || (_record as any).status }}
            </Tag>
          </template>
          <template v-if="column.key === 'progress'">
            <Progress
              :percent="(_record as any).progress || 0"
              size="small"
              :status="
                (_record as any).status === 'failed'
                  ? 'exception'
                  : (_record as any).status === 'success'
                    ? 'success'
                    : 'active'
              "
            />
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showDetail(_record as Command)">
                详情
              </Button>
              <Button
                v-if="(_record as any).status === 'pending' || (_record as any).status === 'running'"
                type="link" size="small" danger
                @click="handleCancel(_record as Command)"
              >
                取消
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Command Detail Modal -->
    <Modal
      v-model:open="detailVisible"
      :title="detailTitle"
      :footer="null"
      width="900px"
    >
      <Table
        :columns="hostColumns"
        :data-source="detailHosts"
        :loading="detailLoading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">
              {{ statusLabelMap[(_record as any).status] || (_record as any).status }}
            </Tag>
          </template>
          <template v-if="column.key === 'progress'">
            <Progress :percent="(_record as any).progress || 0" size="small" />
          </template>
        </template>
        <template #expandedRowRender="{ record: hostRecord }">
          <Table
            :columns="roleColumns"
            :data-source="(hostRecord as any).roles || []"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <template #bodyCell="{ column, record: _roleRecord }">
              <template v-if="column.key === 'status'">
                <Tag :color="statusColorMap[(_roleRecord as any).status] || 'default'">
                  {{ statusLabelMap[(_roleRecord as any).status] || (_roleRecord as any).status }}
                </Tag>
              </template>
            </template>
          </Table>
        </template>
      </Table>
    </Modal>
  </div>
</template>
