<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import {
  Card,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  message,
} from 'ant-design-vue';
import { getAlertSummary, getAlertHistory } from './api/alert';
import { getAlertRules } from './api/alert';
import type { AlertHistory, AlertSummary } from './api/types';

const summaryLoading = ref(false);
const summary = ref<AlertSummary>({
  totalAlerts: 0,
  openAlerts: 0,
  criticalAlerts: 0,
});
const ruleCount = ref(0);

const recentAlerts = ref<AlertHistory[]>([]);
const alertsLoading = ref(false);

const alertColumns = [
  { title: '告警名称', dataIndex: 'alertName', key: 'alertName' },
  { title: '主机', dataIndex: 'hostname', key: 'hostname', width: 150 },
  { title: '级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 180 },
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

async function fetchSummary() {
  summaryLoading.value = true;
  try {
    const res = await getAlertSummary();
    if (res) {
      summary.value = res as AlertSummary;
    }
  } catch (e: any) {
    message.error('获取告警概况失败: ' + e.message);
  } finally {
    summaryLoading.value = false;
  }
}

async function fetchRuleCount() {
  try {
    const res = await getAlertRules();
    ruleCount.value = Array.isArray(res) ? res.length : 0;
  } catch {
    // ignore
  }
}

async function fetchRecentAlerts() {
  alertsLoading.value = true;
  try {
    const res = await getAlertHistory();
    const all = Array.isArray(res) ? res : [];
    recentAlerts.value = all.slice(0, 20);
  } catch (e: any) {
    message.error('获取告警列表失败: ' + e.message);
  } finally {
    alertsLoading.value = false;
  }
}

onMounted(() => {
  fetchSummary();
  fetchRuleCount();
  fetchRecentAlerts();
});
</script>

<template>
  <div class="p-4">
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card :loading="summaryLoading">
          <Statistic title="告警总数" :value="summary.totalAlerts" />
        </Card>
      </Col>
      <Col :span="6">
        <Card :loading="summaryLoading">
          <Statistic
            title="未处理告警"
            :value="summary.openAlerts"
            :value-style="{ color: '#cf1322' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card :loading="summaryLoading">
          <Statistic
            title="严重告警"
            :value="summary.criticalAlerts"
            :value-style="{ color: '#cf1322' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="告警规则数" :value="ruleCount" />
        </Card>
      </Col>
    </Row>

    <Card title="最近告警">
      <Table
        :columns="alertColumns"
        :data-source="recentAlerts"
        :loading="alertsLoading"
        row-key="id"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 800 }"
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
        </template>
      </Table>
    </Card>
  </div>
</template>
