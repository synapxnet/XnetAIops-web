<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Select,
  SelectOption,
  Space,
  Button,
  Progress,
  Statistic,
  Row,
  Col,
  Tag,
  Spin,
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
import {
  getClusterStatus,
  getClusterMetrics,
  getNodeRanking,
} from '../api/monitoring';
import type { K8sCluster } from '../api/types';

echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

const router = useRouter();
const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const status = ref<any>(null);
const nodeRanking = ref<any[]>([]);
const rankMetric = ref('cpu');
const timeRange = ref(3600); // 1 hour default

let timer: ReturnType<typeof setInterval> | null = null;
let cpuChart: echarts.ECharts | null = null;
let memChart: echarts.ECharts | null = null;
const cpuChartRef = ref<HTMLDivElement | null>(null);
const memChartRef = ref<HTMLDivElement | null>(null);

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter((c) => c.status === 'active');
    if (active.length > 0) {
      selectedClusterId.value = active[0]!.id;
      fetchData();
    }
  } catch {
    message.error('获取集群列表失败');
  }
}

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - timeRange.value;
    const [s, nr, metricsData] = await Promise.all([
      getClusterStatus(selectedClusterId.value),
      getNodeRanking(selectedClusterId.value, rankMetric.value, 5),
      getClusterMetrics(selectedClusterId.value, start, end, '60'),
    ]);
    status.value = s;
    nodeRanking.value = Array.isArray(nr) ? nr : [];
    renderCharts(metricsData);
  } catch (e: any) {
    message.error('获取监控数据失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function buildChartOption(
  title: string,
  series: any[],
  color: string,
  formatter: (v: number) => string,
) {
  const data: [Date, number][] = [];
  if (series && Array.isArray(series) && series[0]?.values) {
    for (const [ts, val] of series[0].values) {
      data.push([new Date(ts * 1000), Number(val)]);
    }
  }
  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        if (!p) return '';
        const time = new Date(p.value[0]).toLocaleTimeString();
        return `${time}<br/>${p.seriesName}: ${formatter(p.value[1])}`;
      },
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (val: number) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (val: number) => formatter(val) },
    },
    series: [
      {
        name: title,
        type: 'line',
        data,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '40' },
          { offset: 1, color: color + '05' },
        ]) },
        itemStyle: { color },
      },
    ],
  };
}

function renderCharts(metricsData: any) {
  if (!metricsData) return;

  if (cpuChartRef.value) {
    if (!cpuChart) cpuChart = echarts.init(cpuChartRef.value);
    cpuChart.setOption(
      buildChartOption(
        'CPU使用率',
        metricsData.cpuUsage,
        '#1890ff',
        (v) => (v * 100).toFixed(1) + '%',
      ),
    );
  }

  if (memChartRef.value) {
    if (!memChart) memChart = echarts.init(memChartRef.value);
    memChart.setOption(
      buildChartOption(
        '内存使用率',
        metricsData.memoryUsage,
        '#722ed1',
        (v) => (v * 100).toFixed(1) + '%',
      ),
    );
  }
}

function handleResize() {
  cpuChart?.resize();
  memChart?.resize();
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return val.toFixed(1) + ' ' + units[i];
}

function pct(used: number | null, total: number | null): number {
  if (!used || !total || total === 0) return 0;
  return Math.round((used / total) * 100);
}

onMounted(() => {
  fetchClusters();
  timer = setInterval(() => {
    if (selectedClusterId.value) fetchData();
  }, 30000);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  window.removeEventListener('resize', handleResize);
  cpuChart?.dispose();
  memChart?.dispose();
});
</script>

<template>
  <div class="p-4">
    <Card>
      <template #extra>
        <Space>
          <Select
            :value="selectedClusterId"
            style="width: 150px"
            @change="
              (v: number) => {
                selectedClusterId = v;
                fetchData();
              }
            "
          >
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{
              c.name
            }}</SelectOption>
          </Select>
          <Select
            v-model:value="timeRange"
            size="small"
            style="width: 100px"
            @change="fetchData"
          >
            <SelectOption :value="1800">30分钟</SelectOption>
            <SelectOption :value="3600">1小时</SelectOption>
            <SelectOption :value="10800">3小时</SelectOption>
            <SelectOption :value="86400">24小时</SelectOption>
          </Select>
          <Button @click="fetchData" :loading="loading">刷新</Button>
          <Button
            @click="router.push('/K8S/monitoring/prometheus-config')"
            >Prometheus配置</Button
          >
        </Space>
      </template>
      <template #title>
        <span>集群状态监控</span>
      </template>

      <Spin :spinning="loading">
        <!-- Overview Stats -->
        <Row :gutter="16" class="mb-4">
          <Col :span="6">
            <Card size="small">
              <Statistic
                title="节点"
                :value="`${status?.nodeReady ?? '-'} / ${status?.nodeTotal ?? '-'}`"
              />
              <Tag
                :color="
                  status?.nodeReady === status?.nodeTotal ? 'green' : 'orange'
                "
                style="margin-top: 8px"
              >
                {{
                  status?.nodeReady === status?.nodeTotal
                    ? '全部就绪'
                    : '部分异常'
                }}
              </Tag>
            </Card>
          </Col>
          <Col :span="6">
            <Card size="small">
              <Statistic
                title="Pod"
                :value="`${Math.round(status?.podRunning ?? 0)} / ${Math.round(status?.podTotal ?? 0)}`"
              />
            </Card>
          </Col>
          <Col :span="6">
            <Card size="small">
              <Statistic
                title="内存使用"
                :value="formatBytes(status?.memoryUsed)"
              />
              <div style="color: #8c8c8c; font-size: 12px">
                总量: {{ formatBytes(status?.memoryTotal) }}
              </div>
            </Card>
          </Col>
          <Col :span="6">
            <Card size="small">
              <Statistic
                title="磁盘使用"
                :value="formatBytes(status?.diskUsed)"
              />
              <div style="color: #8c8c8c; font-size: 12px">
                总量: {{ formatBytes(status?.diskTotal) }}
              </div>
            </Card>
          </Col>
        </Row>

        <!-- Resource Usage Gauges -->
        <Row :gutter="16" class="mb-4">
          <Col :span="6" style="text-align: center">
            <Card size="small" title="CPU使用率">
              <Progress
                type="circle"
                :percent="
                  Math.round((status?.cpuUsage ?? 0) * 100)
                "
                :stroke-color="
                  (status?.cpuUsage ?? 0) > 0.8 ? '#ff4d4f' : '#1890ff'
                "
              />
            </Card>
          </Col>
          <Col :span="6" style="text-align: center">
            <Card size="small" title="内存使用率">
              <Progress
                type="circle"
                :percent="pct(status?.memoryUsed, status?.memoryTotal)"
                :stroke-color="
                  pct(status?.memoryUsed, status?.memoryTotal) > 80
                    ? '#ff4d4f'
                    : '#52c41a'
                "
              />
            </Card>
          </Col>
          <Col :span="6" style="text-align: center">
            <Card size="small" title="磁盘使用率">
              <Progress
                type="circle"
                :percent="pct(status?.diskUsed, status?.diskTotal)"
                :stroke-color="
                  pct(status?.diskUsed, status?.diskTotal) > 80
                    ? '#ff4d4f'
                    : '#faad14'
                "
              />
            </Card>
          </Col>
          <Col :span="6" style="text-align: center">
            <Card size="small" title="Pod使用率">
              <Progress
                type="circle"
                :percent="pct(status?.podRunning, status?.podTotal)"
                stroke-color="#722ed1"
              />
            </Card>
          </Col>
        </Row>

        <!-- Time-series Charts -->
        <Row :gutter="16" class="mb-4">
          <Col :span="12">
            <Card size="small">
              <div ref="cpuChartRef" style="height: 260px" />
            </Card>
          </Col>
          <Col :span="12">
            <Card size="small">
              <div ref="memChartRef" style="height: 260px" />
            </Card>
          </Col>
        </Row>

        <!-- Node Ranking -->
        <Card size="small" title="节点使用排名 Top 5">
          <template #extra>
            <Select
              v-model:value="rankMetric"
              size="small"
              style="width: 100px"
              @change="fetchData"
            >
              <SelectOption value="cpu">CPU</SelectOption>
              <SelectOption value="memory">内存</SelectOption>
              <SelectOption value="disk">磁盘</SelectOption>
              <SelectOption value="load">负载</SelectOption>
              <SelectOption value="pod">Pod</SelectOption>
            </Select>
          </template>
          <div
            v-for="(item, idx) in nodeRanking"
            :key="idx"
            style="
              display: flex;
              align-items: center;
              margin-bottom: 12px;
            "
          >
            <Tag
              :color="
                idx === 0
                  ? 'red'
                  : idx === 1
                    ? 'orange'
                    : idx === 2
                      ? 'gold'
                      : 'default'
              "
              style="min-width: 24px; text-align: center"
              >{{ idx + 1 }}</Tag
            >
            <span
              style="
                width: 200px;
                margin: 0 12px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              "
              >{{ item.instance || item.node || '-' }}</span
            >
            <Progress
              :percent="
                rankMetric === 'load' || rankMetric === 'pod'
                  ? Math.min(Math.round(item.value), 100)
                  : Math.round((item.value || 0) * 100)
              "
              :show-info="true"
              style="flex: 1"
              :stroke-color="
                (item.value || 0) > 0.8 ? '#ff4d4f' : '#1890ff'
              "
            />
          </div>
          <div
            v-if="nodeRanking.length === 0"
            style="color: #8c8c8c; text-align: center; padding: 20px"
          >
            暂无数据（请确认Prometheus已配置）
          </div>
        </Card>
      </Spin>
    </Card>
  </div>
</template>
