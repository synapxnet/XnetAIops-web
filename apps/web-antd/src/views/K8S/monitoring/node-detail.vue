<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Select,
  SelectOption,
  Space,
  Button,
  Spin,
  Row,
  Col,
  message,
} from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { getClusters } from '../api/cluster';
import { getNodes } from '../api/node';
import { getNodeMetrics } from '../api/monitoring';
import type { K8sCluster } from '../api/types';

echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

const route = useRoute();
const router = useRouter();

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const nodes = ref<string[]>([]);
const selectedNode = ref('');
const loading = ref(false);
const timeRange = ref(3600);

const cpuRef = ref<HTMLDivElement | null>(null);
const memRef = ref<HTMLDivElement | null>(null);
const loadRef = ref<HTMLDivElement | null>(null);
const netRef = ref<HTMLDivElement | null>(null);
const diskRef = ref<HTMLDivElement | null>(null);

let chartInstances: echarts.ECharts[] = [];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    if (route.params.clusterId) {
      selectedClusterId.value = Number(route.params.clusterId);
    } else {
      const active = clusters.value.filter((c) => c.status === 'active');
      if (active.length > 0) selectedClusterId.value = active[0]!.id;
    }
    if (selectedClusterId.value) await fetchNodeList();
  } catch {
    message.error('获取集群列表失败');
  }
}

async function fetchNodeList() {
  if (!selectedClusterId.value) return;
  try {
    const res = await getNodes(selectedClusterId.value);
    const list = Array.isArray(res) ? res : [];
    nodes.value = list.map((n: any) => n.name);
    if (route.params.nodeName) {
      selectedNode.value = route.params.nodeName as string;
    } else if (nodes.value.length > 0) {
      selectedNode.value = nodes.value[0]!;
    }
    if (selectedNode.value) await fetchData();
  } catch {
    message.error('获取节点列表失败');
  }
}

async function fetchData() {
  if (!selectedClusterId.value || !selectedNode.value) return;
  loading.value = true;
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - timeRange.value;
    const metrics = await getNodeMetrics(
      selectedClusterId.value,
      selectedNode.value,
      start,
      end,
      '60',
    );
    await nextTick();
    renderCharts(metrics);
  } catch (e: any) {
    message.error('获取节点监控数据失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function extractPoints(series: any[]): [Date, number][] {
  const points: [Date, number][] = [];
  if (series && Array.isArray(series)) {
    const values = series[0]?.values || series;
    if (Array.isArray(values)) {
      for (const item of values) {
        if (Array.isArray(item)) {
          points.push([new Date(item[0] * 1000), Number(item[1])]);
        }
      }
    }
  }
  return points;
}

function buildOption(
  title: string,
  seriesCfgs: Array<{ name: string; data: any[]; color: string }>,
  yFmt: (v: number) => string,
  tooltipFmt?: (v: number) => string,
) {
  const series = seriesCfgs.map((cfg) => ({
    name: cfg.name,
    type: 'line' as const,
    data: extractPoints(cfg.data),
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 2 },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: cfg.color + '30' },
        { offset: 1, color: cfg.color + '05' },
      ]),
    },
    itemStyle: { color: cfg.color },
  }));

  const tfmt = tooltipFmt || yFmt;

  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 13 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params?.length) return '';
        const time = new Date(params[0].value[0]).toLocaleTimeString();
        let html = `<b>${time}</b>`;
        for (const p of params) {
          html += `<br/>${p.marker} ${p.seriesName}: ${tfmt(p.value[1])}`;
        }
        return html;
      },
    },
    legend: {
      bottom: 0,
      data: seriesCfgs.map((c) => c.name),
      show: seriesCfgs.length > 1,
    },
    grid: { left: 55, right: 20, top: 35, bottom: seriesCfgs.length > 1 ? 30 : 15 },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (val: number) =>
          new Date(val).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
    },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => yFmt(v) } },
    series,
  };
}

function renderCharts(m: any) {
  if (!m) return;
  chartInstances.forEach((c) => c.dispose());
  chartInstances = [];

  const init = (el: HTMLDivElement | null, opt: any) => {
    if (!el) return;
    const c = echarts.init(el);
    c.setOption(opt);
    chartInstances.push(c);
  };

  const pctFmt = (v: number) => (v * 100).toFixed(1) + '%';
  const pctAxisFmt = (v: number) => (v * 100).toFixed(0) + '%';
  const bytesFmt = (v: number) => {
    if (Math.abs(v) > 1048576) return (v / 1048576).toFixed(1) + ' MB/s';
    if (Math.abs(v) > 1024) return (v / 1024).toFixed(1) + ' KB/s';
    return v.toFixed(0) + ' B/s';
  };

  init(cpuRef.value, buildOption('CPU使用率', [{ name: 'CPU', data: m.cpuUsage || [], color: '#1890ff' }], pctAxisFmt, pctFmt));
  init(memRef.value, buildOption('内存使用率', [{ name: '内存', data: m.memoryUsage || [], color: '#722ed1' }], pctAxisFmt, pctFmt));
  init(loadRef.value, buildOption('系统负载', [
    { name: 'Load 1', data: m.load1 || [], color: '#f5222d' },
    { name: 'Load 5', data: m.load5 || [], color: '#fa8c16' },
    { name: 'Load 15', data: m.load15 || [], color: '#fadb14' },
  ], (v) => v.toFixed(2)));
  init(netRef.value, buildOption('网络流量', [
    { name: '接收', data: m.networkReceive || [], color: '#13c2c2' },
    { name: '发送', data: m.networkTransmit || [], color: '#eb2f96' },
  ], bytesFmt));
  init(diskRef.value, buildOption('磁盘IO利用率', [{ name: 'IO', data: m.diskIO || [], color: '#faad14' }], pctAxisFmt, pctFmt));
}

function handleResize() {
  chartInstances.forEach((c) => c.resize());
}

function goBack() {
  router.back();
}

onMounted(() => {
  fetchClusters();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstances.forEach((c) => c.dispose());
});
</script>

<template>
  <div class="p-4">
    <Card class="mb-4">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <h2 style="margin: 0">节点监控: {{ selectedNode || '请选择节点' }}</h2>
        <Space>
          <Select :value="selectedClusterId" style="width: 150px" placeholder="集群" @change="(v: number) => { selectedClusterId = v; fetchNodeList(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Select v-model:value="selectedNode" style="width: 200px" placeholder="节点" show-search @change="fetchData">
            <SelectOption v-for="n in nodes" :key="n" :value="n">{{ n }}</SelectOption>
          </Select>
          <Select v-model:value="timeRange" size="small" style="width: 100px" @change="fetchData">
            <SelectOption :value="1800">30分钟</SelectOption>
            <SelectOption :value="3600">1小时</SelectOption>
            <SelectOption :value="10800">3小时</SelectOption>
            <SelectOption :value="86400">24小时</SelectOption>
          </Select>
          <Button @click="fetchData" :loading="loading">刷新</Button>
          <Button @click="goBack">返回</Button>
        </Space>
      </div>
    </Card>

    <Spin :spinning="loading">
      <Row :gutter="16" class="mb-4">
        <Col :span="12"><Card size="small"><div ref="cpuRef" style="height: 260px" /></Card></Col>
        <Col :span="12"><Card size="small"><div ref="memRef" style="height: 260px" /></Card></Col>
      </Row>
      <Row :gutter="16" class="mb-4">
        <Col :span="12"><Card size="small"><div ref="loadRef" style="height: 260px" /></Card></Col>
        <Col :span="12"><Card size="small"><div ref="netRef" style="height: 260px" /></Card></Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12"><Card size="small"><div ref="diskRef" style="height: 260px" /></Card></Col>
      </Row>

      <div v-if="!loading && !selectedNode" style="text-align: center; color: #8c8c8c; padding: 40px">
        请选择集群和节点查看监控数据
      </div>
    </Spin>
  </div>
</template>
