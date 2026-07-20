<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Card, Select, SelectOption, Space, Button, Spin, Row, Col, message } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { getClusters } from '../api/cluster';
import { getApiServerMetrics } from '../api/monitoring';
import type { K8sCluster } from '../api/types';

echarts.use([LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const timeRange = ref(3600);

const reqRateRef = ref<HTMLDivElement | null>(null);
const latencyRef = ref<HTMLDivElement | null>(null);
const durationRef = ref<HTMLDivElement | null>(null);
const inflightRef = ref<HTMLDivElement | null>(null);

let chartInstances: echarts.ECharts[] = [];
const colors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

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
    const metrics = await getApiServerMetrics(selectedClusterId.value, start, end, '60');
    await nextTick();
    renderCharts(metrics);
  } catch (e: any) { message.error('获取API Server监控数据失败: ' + e.message); }
  finally { loading.value = false; }
}

function extractPoints(values: any[]): [Date, number][] {
  const pts: [Date, number][] = [];
  if (Array.isArray(values)) {
    for (const item of values) {
      if (Array.isArray(item)) pts.push([new Date(item[0] * 1000), Number(item[1])]);
    }
  }
  return pts;
}

function buildMultiSeriesOption(
  title: string,
  seriesArr: any[],
  labelKey: string,
  yFmt: (v: number) => string,
) {
  const allSeries = (seriesArr || []).map((s: any, i: number) => ({
    name: s[labelKey] || s.code || s.verb || s.request_kind || `Series ${i + 1}`,
    type: 'line' as const,
    data: extractPoints(s.values || []),
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 2 },
    itemStyle: { color: colors[i % colors.length] },
  }));

  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 13 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params?.length) return '';
        const time = new Date(params[0].value[0]).toLocaleTimeString();
        let html = `<b>${time}</b>`;
        for (const p of params) html += `<br/>${p.marker} ${p.seriesName}: ${yFmt(p.value[1])}`;
        return html;
      },
    },
    legend: { bottom: 0, data: allSeries.map(s => s.name) },
    grid: { left: 60, right: 20, top: 35, bottom: allSeries.length > 1 ? 30 : 15 },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: (v: number) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => yFmt(v) } },
    series: allSeries,
  };
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

  init(reqRateRef.value, buildMultiSeriesOption('请求速率 (按状态码)', m.requestRate || [], 'code', v => v.toFixed(2) + ' req/s'));
  init(latencyRef.value, buildMultiSeriesOption('请求延迟 P99 (按动作)', m.requestLatency || [], 'verb', v => v.toFixed(4) + ' s'));
  init(durationRef.value, buildMultiSeriesOption('平均请求延迟', m.requestDuration ? [{ label: '延迟', values: m.requestDuration[0]?.values || [] }] : [], 'label', v => v.toFixed(4) + ' s'));
  init(inflightRef.value, buildMultiSeriesOption('当前并发请求', m.currentInflight || [], 'request_kind', v => v.toFixed(0)));
}

function handleResize() { chartInstances.forEach(c => c.resize()); }

onMounted(() => { fetchClusters(); window.addEventListener('resize', handleResize); });
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); chartInstances.forEach(c => c.dispose()); });
</script>

<template>
  <div class="p-4">
    <Card title="API Server 监控">
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
          <Col :span="12"><Card size="small"><div ref="reqRateRef" style="height:280px" /></Card></Col>
          <Col :span="12"><Card size="small"><div ref="latencyRef" style="height:280px" /></Card></Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12"><Card size="small"><div ref="durationRef" style="height:280px" /></Card></Col>
          <Col :span="12"><Card size="small"><div ref="inflightRef" style="height:280px" /></Card></Col>
        </Row>
        <div v-if="!loading && chartInstances.length === 0" style="text-align:center;color:#8c8c8c;padding:40px">
          暂无数据（请确认Prometheus已配置）
        </div>
      </Spin>
    </Card>
  </div>
</template>
