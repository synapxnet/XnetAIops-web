<script lang="ts" setup>
import type { Registry, DeployLog } from '../api/types';

import { onMounted, ref } from 'vue';

import {
  Card,
  message,
  Select,
  SelectOption,
  Table,
  Tag,
} from 'ant-design-vue';

import { getRegistries } from '../api/registry';
import { getDeployLogs } from '../api/deploy';

const registries = ref<Registry[]>([]);
const selectedRegistryId = ref<number | null>(null);
const logs = ref<DeployLog[]>([]);
const loading = ref(false);

const actionLabelMap: Record<string, string> = {
  install: '安装',
  upgrade: '升级',
  uninstall: '卸载',
  start: '启动',
  stop: '停止',
  restart: '重启',
};

const statusColorMap: Record<string, string> = {
  running: 'processing',
  success: 'success',
  failed: 'error',
};

const statusLabelMap: Record<string, string> = {
  running: '执行中',
  success: '成功',
  failed: '失败',
};

const columns = [
  { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt', width: 180 },
  { title: '结束时间', dataIndex: 'finishedAt', key: 'finishedAt', width: 180 },
  { title: '日志', dataIndex: 'logText', key: 'logText', ellipsis: true },
];

async function fetchRegistries() {
  try {
    const res = await getRegistries();
    registries.value = Array.isArray(res) ? res : [];
  } catch {
    registries.value = [];
  }
}

async function fetchLogs() {
  if (!selectedRegistryId.value) {
    logs.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await getDeployLogs(selectedRegistryId.value);
    logs.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取日志失败');
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function handleRegistryChange(val: number) {
  selectedRegistryId.value = val;
  fetchLogs();
}

onMounted(() => {
  fetchRegistries();
});
</script>

<template>
  <div class="p-4">
    <Card title="部署日志">
      <template #extra>
        <Select
          :value="selectedRegistryId"
          placeholder="选择仓库"
          style="width: 250px"
          allow-clear
          @change="handleRegistryChange"
        >
          <SelectOption v-for="r in registries" :key="r.id" :value="r.id">
            {{ r.registryName }} ({{ r.registryType }})
          </SelectOption>
        </Select>
      </template>

      <Table
        :columns="columns"
        :data-source="logs"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 20 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            {{ actionLabelMap[record.action] || record.action }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status]">
              {{ statusLabelMap[record.status] || record.status }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'logText'">
            <pre v-if="record.logText" class="max-h-32 overflow-auto text-xs">{{ record.logText }}</pre>
            <span v-else class="text-gray-400">-</span>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
