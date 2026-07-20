<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import { getAlertHistory, acknowledgeAlert, resolveAlert } from '../api/alert';
import type { AlertHistory } from '../api/types';

const loading = ref(false);
const alerts = ref<AlertHistory[]>([]);
const statusFilter = ref<string | undefined>(undefined);

const columns = [
  { title: '告警名称', dataIndex: 'alertName', key: 'alertName' },
  { title: '主机', dataIndex: 'hostname', key: 'hostname', width: 150 },
  { title: '级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '告警信息', dataIndex: 'alertInfo', key: 'alertInfo', ellipsis: true },
  { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

const levelColorMap: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  critical: 'red',
};

const statusColorMap: Record<string, string> = {
  open: 'red',
  acknowledged: 'orange',
  resolved: 'green',
};

async function fetchAlerts() {
  loading.value = true;
  try {
    const res = await getAlertHistory(undefined, statusFilter.value);
    alerts.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取告警历史失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function onStatusChange() {
  fetchAlerts();
}

async function handleAcknowledge(record: AlertHistory) {
  try {
    await acknowledgeAlert(record.id);
    message.success('已确认');
    fetchAlerts();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

async function handleResolve(record: AlertHistory) {
  Modal.confirm({
    title: '确认解决',
    content: `确定要将告警「${record.alertName}」标记为已解决吗？`,
    async onOk() {
      try {
        await resolveAlert(record.id);
        message.success('已解决');
        fetchAlerts();
      } catch (e: any) {
        message.error('操作失败: ' + e.message);
      }
    },
  });
}

function showDetail(record: AlertHistory) {
  Modal.info({
    title: record.alertName,
    width: 600,
    content: `主机: ${record.hostname || '-'}
级别: ${record.alertLevel}
状态: ${record.status}
告警信息: ${record.alertInfo || '-'}
处理建议: ${record.alertAdvice || '-'}
触发时间: ${record.triggeredAt || '-'}
解决时间: ${record.resolvedAt || '-'}`,
  });
}

onMounted(() => {
  fetchAlerts();
});
</script>

<template>
  <div class="p-4">
    <Card title="告警历史">
      <template #extra>
        <Select
          v-model:value="statusFilter"
          placeholder="状态筛选"
          style="width: 150px"
          allow-clear
          @change="onStatusChange"
        >
          <SelectOption value="open">未处理</SelectOption>
          <SelectOption value="acknowledged">已确认</SelectOption>
          <SelectOption value="resolved">已解决</SelectOption>
        </Select>
      </template>
      <Table
        :columns="columns"
        :data-source="alerts"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'alertLevel'">
            <Tag :color="levelColorMap[(_record as any).alertLevel] || 'default'">
              {{ (_record as any).alertLevel }}
            </Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">
              {{ (_record as any).status }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showDetail(_record as AlertHistory)">
                详情
              </Button>
              <Button
                v-if="(_record as any).status === 'open'"
                type="link"
                size="small"
                @click="handleAcknowledge(_record as AlertHistory)"
              >
                确认
              </Button>
              <Button
                v-if="(_record as any).status !== 'resolved'"
                type="link"
                size="small"
                @click="handleResolve(_record as AlertHistory)"
              >
                解决
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
