<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Space, Button, Select, SelectOption, message } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getAlertHistory } from '../api/monitoring';
import type { K8sCluster } from '../api/types';

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const history = ref<any[]>([]);

const columns = [
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '级别', key: 'severity', width: 80 },
  { title: '资源类型', dataIndex: 'resourceType', key: 'resourceType', width: 100 },
  { title: '资源名称', dataIndex: 'resourceName', key: 'resourceName', width: 150 },
  { title: '状态', key: 'status', width: 80 },
  { title: '当前值/阈值', key: 'values', width: 140 },
  { title: '消息', dataIndex: 'message', key: 'message' },
  { title: '触发时间', dataIndex: 'firedAt', key: 'firedAt', width: 180 },
  { title: '恢复时间', dataIndex: 'resolvedAt', key: 'resolvedAt', width: 180 },
];

const severityColors: Record<string, string> = { critical: 'red', warning: 'orange', info: 'blue' };

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter(c => c.status === 'active');
    if (active.length > 0) { selectedClusterId.value = active[0]!.id; fetchData(); }
  } catch { message.error('获取集群列表失败'); }
}

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getAlertHistory(selectedClusterId.value, 200);
    history.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取告警历史失败: ' + e.message); }
  finally { loading.value = false; }
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="告警历史">
      <template #extra>
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchData(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="history" :loading="loading" row-key="id" :scroll="{ x: 1200 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'severity'">
            <Tag :color="severityColors[record.severity] || 'default'">{{ record.severity }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'firing' ? 'red' : 'green'">{{ record.status === 'firing' ? '触发中' : '已恢复' }}</Tag>
          </template>
          <template v-if="column.key === 'values'">
            {{ record.currentValue?.toFixed(2) || '-' }} / {{ record.threshold?.toFixed(2) || '-' }}
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
