<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Card, Select, SelectOption, Space, Button, Spin, Row, Col, message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { getClusters } from '../api/cluster';
import { getEtcdMetrics } from '../api/monitoring';
import type { K8sCluster } from '../api/types';

echarts.use([LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const timeRange = ref(3600);

const dbSizeRef = ref<HTMLDivElement | null>(null);
const walRef = ref<HTMLDivElement | null>(null);
const commitRef = ref<HTMLDivElement | null>(null);
const leaderRef = ref<HTMLDivElement | null>(null);
const proposalRef = ref<HTMLDivElement | null>(null);
const grpcRef = ref<HTMLDivElement | null>(null);

let chartInstances: echarts.ECharts[] = [];

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
    const end = Math.floor(Date.now() / 1000);
    const start = end - timeRange.value;
    const metrics = await getEtcdMetrics(selectedClusterId.value, start, end, '60');
    await nextTick();
    renderCharts(metrics);
  } catch (e: any) { message.error('获取ETCD监控数据失败: ' + e.message); }
  finally { loading.value = false; }
}

function extractPoints(series: any[]): [Date, number][] {
  const points: [Date, number][] = [];
  if (series && Array.isArray(series)) {
    const values = series[0]?.values || series;
    if (Array.isArray(values)) {
      for (const item of values) {
        if (Array.isArray(item)) points.push([new Date(item[0] * 1000), Number(item[1])]);
      }
    }
  }
  return points;
}

function buildOption(title: string, data: any[], color: string, yFmt: (v: number) => string) {
  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 13 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params?.length) return '';
        const time = new Date(params[0].value[0]).toLocaleTimeString();
        return `<b>${time}</b><br/>${params[0].marker} ${yFmt(params[0].value[1])}`;
      },
    },
    grid: { left: 60, right: 20, top: 35, bottom: 15 },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: (v: number) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => yFmt(v) } },
    series: [{
      type: 'line', data: extractPoints(data), smooth: true, showSymbol: false,
      lineStyle: { width: 2 }, itemStyle: { color },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '30' }, { offset: 1, color: color + '05' }]) },
    }],
  };
}

function fmtBytes(v: number) {
  if (v > 1073741824) return (v / 1073741824).toFixed(2) + ' GB';
  if (v > 1048576) return (v / 1048576).toFixed(2) + ' MB';
  return (v / 1024).toFixed(1) + ' KB';
}

function renderCharts(m: any) {
  if (!m) return;
  chartInstances.forEach(c => c.dispose());
  chartInstances = [];

  const init = (el: HTMLDivElement | null, opt: any) => {
    if (!el) return;
    const c = echarts.init(el);
    c.setOption(opt);
    chartInstances.push(c);
  };

  init(dbSizeRef.value, buildOption('数据库大小', m.dbSize || [], '#1890ff', fmtBytes));
  init(walRef.value, buildOption('WAL Fsync 延迟 (P99)', m.walFsyncDuration || [], '#f5222d', v => v.toFixed(4) + ' s'));
  init(commitRef.value, buildOption('Backend Commit 延迟 (P99)', m.backendCommitDuration || [], '#722ed1', v => v.toFixed(4) + ' s'));
  init(leaderRef.value, buildOption('Leader变更次数', m.leaderChanges || [], '#fa8c16', v => v.toFixed(0)));
  init(proposalRef.value, buildOption('Proposal提交速率', m.proposals || [], '#52c41a', v => v.toFixed(2) + ' /s'));
  init(grpcRef.value, buildOption('gRPC请求速率', m.grpcRequestRate || [], '#13c2c2', v => v.toFixed(2) + ' /s'));
}

function handleResize() { chartInstances.forEach(c => c.resize()); }

onMounted(() => { fetchClusters(); window.addEventListener('resize', handleResize); });
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); chartInstances.forEach(c => c.dispose()); });
</script>

<template>
  <div class="p-4">
    <Card title="ETCD 监控">
      <template #extra>
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchData(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Select v-model:value="timeRange" size="small" style="width:100px" @change="fetchData">
            <SelectOption :value="1800">30分钟</SelectOption>
            <SelectOption :value="3600">1小时</SelectOption>
            <SelectOption :value="10800">3小时</SelectOption>
            <SelectOption :value="86400">24小时</SelectOption>
          </Select>
          <Button @click="fetchData" :loading="loading">刷新</Button>
        </Space>
      </template>
      <Spin :spinning="loading">
        <Row :gutter="16" class="mb-4">
          <Col :span="12"><Card size="small"><div ref="dbSizeRef" style="height:240px" /></Card></Col>
          <Col :span="12"><Card size="small"><div ref="walRef" style="height:240px" /></Card></Col>
        </Row>
        <Row :gutter="16" class="mb-4">
          <Col :span="12"><Card size="small"><div ref="commitRef" style="height:240px" /></Card></Col>
          <Col :span="12"><Card size="small"><div ref="leaderRef" style="height:240px" /></Card></Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12"><Card size="small"><div ref="proposalRef" style="height:240px" /></Card></Col>
          <Col :span="12"><Card size="small"><div ref="grpcRef" style="height:240px" /></Card></Col>
        </Row>
        <div v-if="!loading && chartInstances.length === 0" style="text-align:center;color:#8c8c8c;padding:40px">
          暂无数据（请确认Prometheus已配置）
        </div>
      </Spin>
    </Card>
  </div>
</template>
