<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { usePreferences } from '@vben/preferences';

import {
  AimOutlined,
  AlertOutlined,
  ApartmentOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  EyeOutlined,
  ReloadOutlined,
  RightOutlined,
  SyncOutlined,
  WarningFilled,
} from '@ant-design/icons-vue';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { use as useEcharts } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import * as THREE from 'three';
import VChart from 'vue-echarts';

import { createNetworkLines } from './components/NetworkTopology';
import { createServerNode } from './components/ServerNode';
import { createServerRack } from './components/ServerRack';
import type { CameraView } from './composables/useThreeScene';
import { useClusterData } from './composables/useClusterData';
import { useInteraction } from './composables/useInteraction';
import { useThreeScene } from './composables/useThreeScene';
import { RACK_GAP, ROW_GAP } from './constants';

useEcharts([
  BarChart,
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  TooltipComponent,
]);

type NodeStatus = 'error' | 'offline' | 'online' | 'warning';

interface DashboardNode {
  cpuUsage: number;
  hostname: string;
  id: number;
  ipAddress: string;
  rackName: string;
  status: NodeStatus;
  totalMemGb: number;
  usedMemGb: number;
}

const router = useRouter();
const { isDark } = usePreferences();
const containerRef = ref<HTMLElement | null>(null);
const activeView = ref<CameraView>('overview');
const autoRotate = ref(false);
const sceneReady = ref(false);
const lastUpdated = ref(formatCurrentTime());
const sceneObjects = ref<THREE.Object3D[]>([]);

const { camera, init, scene, setAutoRotate, setCameraView, setTheme } =
  useThreeScene();
const {
  clusters,
  fetchHosts,
  hosts,
  loading,
  loadData,
  rackGroups,
  selectedClusterId,
  switchCluster,
} = useClusterData();
const { hoveredNode, onClick, onMouseMove, selectedNode } = useInteraction(
  camera,
  scene,
);

const demoNodes: DashboardNode[] = [
  {
    id: 1001,
    hostname: 'compute-a01',
    ipAddress: '198.51.100.21',
    rackName: 'A01',
    status: 'online',
    cpuUsage: 42,
    usedMemGb: 38,
    totalMemGb: 64,
  },
  {
    id: 1002,
    hostname: 'compute-a02',
    ipAddress: '198.51.100.22',
    rackName: 'A01',
    status: 'online',
    cpuUsage: 58,
    usedMemGb: 44,
    totalMemGb: 64,
  },
  {
    id: 2001,
    hostname: 'compute-b01',
    ipAddress: '198.51.100.31',
    rackName: 'B01',
    status: 'warning',
    cpuUsage: 83,
    usedMemGb: 53,
    totalMemGb: 64,
  },
  {
    id: 2002,
    hostname: 'compute-b02',
    ipAddress: '198.51.100.32',
    rackName: 'B02',
    status: 'online',
    cpuUsage: 61,
    usedMemGb: 41,
    totalMemGb: 64,
  },
  {
    id: 3001,
    hostname: 'storage-c01',
    ipAddress: '198.51.100.41',
    rackName: 'C01',
    status: 'online',
    cpuUsage: 36,
    usedMemGb: 29,
    totalMemGb: 64,
  },
  {
    id: 3002,
    hostname: 'storage-c02',
    ipAddress: '198.51.100.42',
    rackName: 'C01',
    status: 'error',
    cpuUsage: 91,
    usedMemGb: 58,
    totalMemGb: 64,
  },
  {
    id: 4001,
    hostname: 'gateway-d01',
    ipAddress: '198.51.100.51',
    rackName: 'D01',
    status: 'online',
    cpuUsage: 47,
    usedMemGb: 34,
    totalMemGb: 64,
  },
  {
    id: 4002,
    hostname: 'gateway-d02',
    ipAddress: '198.51.100.52',
    rackName: 'D02',
    status: 'offline',
    cpuUsage: 0,
    usedMemGb: 0,
    totalMemGb: 64,
  },
];

const events = [
  {
    level: 'warning',
    target: 'compute-b01',
    text: 'CPU 使用率连续 5 分钟超过阈值',
    time: '15:28',
  },
  {
    level: 'online',
    target: 'storage-c01',
    text: '存储副本同步完成',
    time: '15:24',
  },
  {
    level: 'error',
    target: 'storage-c02',
    text: '节点健康检查失败',
    time: '15:18',
  },
  {
    level: 'online',
    target: 'gateway-d01',
    text: '网络策略更新完成',
    time: '15:12',
  },
];

const showcaseRackNames = [
  'A01',
  'A02',
  'B01',
  'B02',
  'C01',
  'C02',
  'D01',
  'D02',
];
const showcaseStatusPattern: NodeStatus[] = [
  'online',
  'online',
  'online',
  'warning',
  'online',
  'error',
  'online',
  'offline',
];

const dashboardNodes = computed<DashboardNode[]>(() => {
  if (hosts.value.length === 0) return demoNodes;
  return hosts.value.slice(0, 10).map((host, index) => ({
    cpuUsage: Number(host.cpuUsage || 0),
    hostname: host.hostname || `node-${index + 1}`,
    id: Number(host.id),
    ipAddress: host.ipAddress || '-',
    rackName: host.rack || '/default',
    status: normalizeStatus(host.status),
    totalMemGb: Number(host.totalMemGb || 0),
    usedMemGb: Number(host.usedMemGb || 0),
  }));
});

const isDemoMode = computed(() => hosts.value.length === 0);
const isTopologyEnhanced = computed(
  () => rackGroups.value.length > 0 && rackGroups.value.length < 4,
);
const nodeStatusCounts = computed(() => {
  if (isDemoMode.value) {
    return { error: 2, offline: 3, online: 39, warning: 4 };
  }
  return dashboardNodes.value.reduce(
    (result, node) => {
      result[node.status] += 1;
      return result;
    },
    { error: 0, offline: 0, online: 0, warning: 0 },
  );
});
const nodeTotal = computed(() =>
  isDemoMode.value ? 48 : dashboardNodes.value.length,
);
const cpuAverage = computed(() => averageValue('cpuUsage', 57.6));
const memoryAverage = computed(() => {
  if (isDemoMode.value) return 68.4;
  const ratios = dashboardNodes.value
    .filter((node) => node.totalMemGb > 0)
    .map((node) => (node.usedMemGb / node.totalMemGb) * 100);
  if (ratios.length === 0) return 0;
  return Number(
    (ratios.reduce((sum, value) => sum + value, 0) / ratios.length).toFixed(1),
  );
});
const alertTotal = computed(
  () => nodeStatusCounts.value.warning + nodeStatusCounts.value.error,
);

const metricCards = computed(() => [
  {
    icon: ApartmentOutlined,
    label: '集群总数',
    note: '全部连接',
    tone: 'primary',
    unit: '个',
    value: clusters.value.length || 3,
  },
  {
    icon: CloudServerOutlined,
    label: '在线节点',
    note: `共 ${nodeTotal.value} 台`,
    tone: 'success',
    unit: '台',
    value: nodeStatusCounts.value.online,
  },
  {
    icon: DashboardOutlined,
    label: 'CPU 平均负载',
    note: '较上小时 -2.4%',
    tone: 'primary',
    unit: '%',
    value: cpuAverage.value,
  },
  {
    icon: DatabaseOutlined,
    label: '内存使用',
    note: '容量余量充足',
    tone: 'primary',
    unit: '%',
    value: memoryAverage.value,
  },
  {
    icon: AlertOutlined,
    label: '活动告警',
    note: `${nodeStatusCounts.value.error} 条严重`,
    tone: 'warning',
    unit: '条',
    value: alertTotal.value,
  },
  {
    icon: ClockCircleOutlined,
    label: '连续运行',
    note: '核心服务稳定',
    tone: 'primary',
    unit: '天',
    value: 186,
  },
]);

const chartColors = computed(() => ({
  axis: isDark.value ? '#6f8da5' : '#7b8c99',
  border: isDark.value ? '#18344a' : '#d8e2ea',
  green: '#2fcf8c',
  orange: '#ffae32',
  primary: isDark.value ? '#37a8ff' : '#1677c8',
  red: '#ff5b6e',
  text: isDark.value ? '#dcecf7' : '#25394a',
}));

const statusOption = computed(() => ({
  animationDuration: 420,
  grid: { bottom: 22, left: 26, right: 8, top: 22 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    axisLabel: { color: chartColors.value.axis, fontSize: 10 },
    axisLine: { lineStyle: { color: chartColors.value.border } },
    axisTick: { show: false },
    data: ['在线', '离线', '告警', '故障'],
    type: 'category',
  },
  yAxis: {
    axisLabel: { color: chartColors.value.axis, fontSize: 10 },
    splitLine: { lineStyle: { color: chartColors.value.border } },
    type: 'value',
  },
  series: [
    {
      barMaxWidth: 22,
      data: [
        {
          itemStyle: { color: chartColors.value.green },
          value: nodeStatusCounts.value.online,
        },
        {
          itemStyle: { color: chartColors.value.axis },
          value: nodeStatusCounts.value.offline,
        },
        {
          itemStyle: { color: chartColors.value.orange },
          value: nodeStatusCounts.value.warning,
        },
        {
          itemStyle: { color: chartColors.value.red },
          value: nodeStatusCounts.value.error,
        },
      ],
      label: { color: chartColors.value.text, position: 'top', show: true },
      type: 'bar',
    },
  ],
}));

const trendOption = computed(() => ({
  animationDuration: 420,
  grid: { bottom: 28, left: 38, right: 16, top: 24 },
  legend: {
    data: ['CPU', '内存'],
    itemHeight: 3,
    itemWidth: 14,
    right: 8,
    textStyle: { color: chartColors.value.axis, fontSize: 10 },
    top: 0,
  },
  tooltip: { trigger: 'axis' },
  xAxis: {
    axisLabel: { color: chartColors.value.axis, fontSize: 10 },
    axisLine: { lineStyle: { color: chartColors.value.border } },
    axisTick: { show: false },
    boundaryGap: false,
    data: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
    type: 'category',
  },
  yAxis: {
    axisLabel: {
      color: chartColors.value.axis,
      formatter: '{value}%',
      fontSize: 10,
    },
    max: 100,
    splitLine: { lineStyle: { color: chartColors.value.border } },
    type: 'value',
  },
  series: [
    {
      areaStyle: {
        color: isDark.value ? 'rgba(55,168,255,.12)' : 'rgba(22,119,200,.1)',
      },
      data: [45, 58, 52, 66, 61, cpuAverage.value],
      lineStyle: { color: chartColors.value.primary, width: 2 },
      name: 'CPU',
      showSymbol: false,
      smooth: true,
      type: 'line',
    },
    {
      data: [62, 64, 71, 67, 70, memoryAverage.value],
      lineStyle: { color: chartColors.value.green, width: 2 },
      name: '内存',
      showSymbol: false,
      smooth: true,
      type: 'line',
    },
  ],
}));

const capacityOption = computed(() => ({
  animationDuration: 420,
  legend: {
    bottom: 2,
    itemHeight: 8,
    itemWidth: 8,
    textStyle: { color: chartColors.value.axis, fontSize: 10 },
  },
  series: [
    {
      data: [
        { name: '计算', value: 46 },
        { name: '存储', value: 32 },
        { name: '网络', value: 22 },
      ],
      emphasis: { scale: false },
      itemStyle: {
        borderColor: isDark.value ? '#091928' : '#ffffff',
        borderWidth: 2,
      },
      label: { show: false },
      radius: ['48%', '72%'],
      type: 'pie',
    },
  ],
  color: [
    chartColors.value.primary,
    chartColors.value.green,
    chartColors.value.orange,
  ],
  tooltip: { trigger: 'item' },
}));

const tooltipStyle = computed(() => {
  const node = hoveredNode.value;
  const container = containerRef.value;
  if (!node || !container) return {};
  return {
    left: `${Math.max(12, Math.min(node.screenX + 16, container.clientWidth - 226))}px`,
    top: `${Math.max(74, Math.min(node.screenY - 18, container.clientHeight - 150))}px`,
  };
});

function formatCurrentTime() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function averageValue(key: 'cpuUsage', fallback: number) {
  if (isDemoMode.value || dashboardNodes.value.length === 0) return fallback;
  const sum = dashboardNodes.value.reduce(
    (total, node) => total + node[key],
    0,
  );
  return Number((sum / dashboardNodes.value.length).toFixed(1));
}

function normalizeStatus(status?: string): NodeStatus {
  const value = String(status || '').toLowerCase();
  if (['active', 'healthy', 'online', 'ready', 'running'].includes(value)) {
    return 'online';
  }
  if (['degraded', 'pending', 'warning'].includes(value)) return 'warning';
  if (['error', 'failed', 'unhealthy'].includes(value)) return 'error';
  return 'offline';
}

function statusLabel(status: NodeStatus) {
  return {
    error: '故障',
    offline: '离线',
    online: '在线',
    warning: '告警',
  }[status];
}

function gaugeStyle(value: number, color: string) {
  return {
    '--gauge-color': color,
    '--gauge-value': `${Math.min(Math.max(value, 0), 100) * 3.6}deg`,
  };
}

function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line)) return;
    geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    childMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    const materialWithMap = material as THREE.Material & {
      map?: THREE.Texture | null;
    };
    materialWithMap.map?.dispose();
    material.dispose();
  });
}

function clearScene() {
  sceneObjects.value.forEach((object) => {
    scene.remove(object);
    disposeObject(object);
  });
  sceneObjects.value = [];
}

function rackPosition(index: number, total: number) {
  const racksPerRow = Math.min(4, Math.max(2, Math.ceil(total / 2)));
  const row = Math.floor(index / racksPerRow);
  const rowCount = Math.ceil(total / racksPerRow);
  const itemsInRow = Math.min(racksPerRow, total - row * racksPerRow);
  const column = index % racksPerRow;
  return new THREE.Vector3(
    (column - (itemsInRow - 1) / 2) * RACK_GAP,
    0.22,
    (row - (rowCount - 1) / 2) * ROW_GAP,
  );
}

function addShowcaseRack(
  rackName: string,
  rackIndex: number,
  rackTotal: number,
  rackPositions: THREE.Vector3[],
  interactive = true,
) {
  const position = rackPosition(rackIndex, rackTotal);
  const rack = createServerRack(rackName, isDark.value);
  rack.position.copy(position);
  scene.add(rack);
  sceneObjects.value.push(rack);
  rackPositions.push(position);

  for (let slotIndex = 0; slotIndex < 6; slotIndex += 1) {
    const status =
      showcaseStatusPattern[
        (rackIndex + slotIndex) % showcaseStatusPattern.length
      ]!;
    rack.add(
      createServerNode(
        {
          cpuUsage: 28 + ((rackIndex * 13 + slotIndex * 9) % 67),
          hostname: `node-${rackName.toLowerCase()}-${slotIndex + 1}`,
          id: 10_000 + rackIndex * 10 + slotIndex,
          interactive,
          ipAddress: `198.51.100.${20 + rackIndex * 6 + slotIndex}`,
          status,
          totalMemGb: 64,
          usedMemGb: 22 + ((rackIndex * 7 + slotIndex * 5) % 38),
        },
        slotIndex,
        isDark.value,
      ),
    );
  }
}

function buildDemoScene(rackPositions: THREE.Vector3[]) {
  showcaseRackNames.forEach((rackName, rackIndex) => {
    addShowcaseRack(
      rackName,
      rackIndex,
      showcaseRackNames.length,
      rackPositions,
    );
  });
}

function buildEnhancedScene(rackPositions: THREE.Vector3[]) {
  const liveRackNames = new Set(
    rackGroups.value.map((rackGroup) => rackGroup.rackName),
  );
  const capacityRackNames = showcaseRackNames
    .filter((rackName) => !liveRackNames.has(rackName))
    .slice(0, Math.max(0, 8 - rackGroups.value.length));
  const totalRacks = rackGroups.value.length + capacityRackNames.length;

  rackGroups.value.forEach((rackGroup, index) => {
    const position = rackPosition(index, totalRacks);
    const rack = createServerRack(rackGroup.rackName, isDark.value);
    rack.position.copy(position);
    scene.add(rack);
    sceneObjects.value.push(rack);
    rackPositions.push(position);

    rackGroup.hosts.slice(0, 8).forEach((host, slotIndex) => {
      rack.add(
        createServerNode(
          {
            cpuUsage: Number(host.cpuUsage || 0),
            hostname: host.hostname,
            id: Number(host.id),
            ipAddress: host.ipAddress,
            status: normalizeStatus(host.status),
            totalMemGb: Number(host.totalMemGb || 0),
            usedMemGb: Number(host.usedMemGb || 0),
          },
          slotIndex,
          isDark.value,
        ),
      );
    });
  });

  capacityRackNames.forEach((rackName, offset) => {
    addShowcaseRack(
      rackName,
      rackGroups.value.length + offset,
      totalRacks,
      rackPositions,
      false,
    );
  });
}

function buildScene() {
  if (!sceneReady.value) return;
  clearScene();
  const rackPositions: THREE.Vector3[] = [];

  if (rackGroups.value.length === 0) {
    buildDemoScene(rackPositions);
  } else if (isTopologyEnhanced.value) {
    buildEnhancedScene(rackPositions);
  } else {
    rackGroups.value.forEach((rackGroup, index) => {
      const position = rackPosition(index, rackGroups.value.length);
      const rack = createServerRack(rackGroup.rackName, isDark.value);
      rack.position.copy(position);
      scene.add(rack);
      sceneObjects.value.push(rack);
      rackPositions.push(position);

      rackGroup.hosts.slice(0, 8).forEach((host, slotIndex) => {
        rack.add(
          createServerNode(
            {
              cpuUsage: Number(host.cpuUsage || 0),
              hostname: host.hostname,
              id: Number(host.id),
              ipAddress: host.ipAddress,
              status: normalizeStatus(host.status),
              totalMemGb: Number(host.totalMemGb || 0),
              usedMemGb: Number(host.usedMemGb || 0),
            },
            slotIndex,
            isDark.value,
          ),
        );
      });
    });
  }

  if (rackPositions.length > 1) {
    const topology = createNetworkLines(rackPositions);
    scene.add(topology);
    sceneObjects.value.push(topology);
  }
}

function handleMouseMove(event: MouseEvent) {
  if (containerRef.value) onMouseMove(event, containerRef.value);
}

function handleClick(event: MouseEvent) {
  if (containerRef.value) onClick(event, containerRef.value);
}

function handleClusterChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  if (value) switchCluster(value);
}

function changeView(view: CameraView) {
  activeView.value = view;
  setCameraView(view);
}

function togglePatrol() {
  autoRotate.value = !autoRotate.value;
  setAutoRotate(autoRotate.value);
}

async function refreshData() {
  await fetchHosts();
  lastUpdated.value = formatCurrentTime();
}

function selectDashboardNode(node: DashboardNode) {
  selectedNode.value = {
    cpuUsage: node.cpuUsage,
    hostname: node.hostname,
    id: node.id,
    ipAddress: node.ipAddress,
    screenX: 0,
    screenY: 0,
    status: node.status,
    totalMemGb: node.totalMemGb,
    usedMemGb: node.usedMemGb,
  };
}

watch(rackGroups, buildScene, { deep: true });
watch(isDark, (value) => {
  setTheme(value);
  buildScene();
});

onMounted(async () => {
  if (!containerRef.value) return;
  init(containerRef.value, isDark.value);
  sceneReady.value = true;
  await loadData();
  buildScene();
});
</script>

<template>
  <div
    class="cluster-cockpit"
    :class="{ 'cluster-cockpit--dark': isDark }"
  >
    <section class="metrics-grid" aria-label="集群核心指标">
      <article
        v-for="metric in metricCards"
        :key="metric.label"
        class="metric-card"
        :class="`metric-card--${metric.tone}`"
      >
        <span class="metric-icon"><component :is="metric.icon" /></span>
        <div class="metric-copy">
          <span class="metric-label">{{ metric.label }}</span>
          <strong class="metric-value">
            {{ metric.value }}<small>{{ metric.unit }}</small>
          </strong>
          <span class="metric-note">{{ metric.note }}</span>
        </div>
      </article>
    </section>

    <section class="operations-grid">
      <aside class="left-rail">
        <section class="cockpit-panel health-panel">
          <header class="panel-heading">
            <span><DashboardOutlined />运行健康</span>
            <small>实时</small>
          </header>
          <div class="gauge-grid">
            <div class="gauge-item">
              <div
                class="health-gauge"
                :style="gaugeStyle(cpuAverage, 'var(--cockpit-primary)')"
              >
                <span>{{ cpuAverage }}%</span>
              </div>
              <strong>CPU</strong>
            </div>
            <div class="gauge-item">
              <div
                class="health-gauge"
                :style="gaugeStyle(memoryAverage, 'var(--cockpit-success)')"
              >
                <span>{{ memoryAverage }}%</span>
              </div>
              <strong>内存</strong>
            </div>
          </div>
          <dl class="health-facts">
            <div>
              <dt>服务可用率</dt>
              <dd>99.86%</dd>
            </div>
            <div>
              <dt>平均延迟</dt>
              <dd>18 ms</dd>
            </div>
            <div>
              <dt>网络吞吐</dt>
              <dd>8.4 Gb/s</dd>
            </div>
            <div>
              <dt>任务队列</dt>
              <dd>12</dd>
            </div>
          </dl>
        </section>

        <section class="cockpit-panel alert-panel">
          <header class="panel-heading">
            <span><AlertOutlined />告警概况</span>
            <small>{{ alertTotal }} 条</small>
          </header>
          <div class="alert-summary">
            <div>
              <CloseCircleFilled class="status-error" /><span>严重</span
              ><strong>{{ nodeStatusCounts.error }}</strong>
            </div>
            <div>
              <WarningFilled class="status-warning" /><span>警告</span
              ><strong>{{ nodeStatusCounts.warning }}</strong>
            </div>
            <div>
              <CheckCircleFilled class="status-online" /><span>已恢复</span
              ><strong>8</strong>
            </div>
          </div>
        </section>
      </aside>

      <section class="scene-stage" aria-label="集群三维机房">
        <header class="scene-command-bar">
          <div class="scene-identity">
            <span class="live-indicator" />
            <div>
              <strong>集群 3D 运行视图</strong>
              <small>{{
                isDemoMode
                  ? '演示数据'
                  : isTopologyEnhanced
                    ? `拓扑演示 · ${lastUpdated}`
                    : `更新于 ${lastUpdated}`
              }}</small>
            </div>
          </div>

          <div class="scene-controls">
            <select
              v-if="clusters.length > 0"
              class="cluster-select"
              :value="selectedClusterId"
              aria-label="选择集群"
              @change="handleClusterChange"
            >
              <option
                v-for="cluster in clusters"
                :key="cluster.id"
                :value="cluster.id"
              >
                {{ cluster.clusterName }}
              </option>
            </select>
            <span v-else class="demo-cluster-name">默认演示集群</span>

            <div class="view-switch" aria-label="视角切换">
              <button
                :class="{ active: activeView === 'overview' }"
                type="button"
                title="全景视角"
                @click="changeView('overview')"
              >
                <EyeOutlined /><span>全景</span>
              </button>
              <button
                :class="{ active: activeView === 'top' }"
                type="button"
                title="俯视视角"
                @click="changeView('top')"
              >
                <AimOutlined /><span>俯视</span>
              </button>
            </div>

            <button
              class="icon-button"
              :class="{ active: autoRotate }"
              type="button"
              title="自动巡航"
              @click="togglePatrol"
            >
              <SyncOutlined />
            </button>
            <button
              class="icon-button"
              type="button"
              title="刷新数据"
              @click="refreshData"
            >
              <ReloadOutlined :class="{ spinning: loading }" />
            </button>
          </div>
        </header>

        <div
          ref="containerRef"
          class="scene-container"
          @click="handleClick"
          @mousemove="handleMouseMove"
        />

        <div v-if="loading" class="scene-loading" aria-live="polite">
          <span /><span /><span />
        </div>

        <div class="scene-legend">
          <span><i class="legend-line legend-line--primary" />数据链路</span>
          <span><i class="legend-line legend-line--warning" />告警链路</span>
          <span><i class="legend-dot legend-dot--online" />在线</span>
          <span><i class="legend-dot legend-dot--error" />故障</span>
        </div>

        <div v-if="hoveredNode" class="node-tooltip" :style="tooltipStyle">
          <header>{{ hoveredNode.hostname }}</header>
          <dl>
            <div>
              <dt>IP</dt>
              <dd>{{ hoveredNode.ipAddress }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd :class="`status-${normalizeStatus(hoveredNode.status)}`">
                {{ statusLabel(normalizeStatus(hoveredNode.status)) }}
              </dd>
            </div>
            <div>
              <dt>CPU</dt>
              <dd>{{ hoveredNode.cpuUsage }}%</dd>
            </div>
            <div>
              <dt>内存</dt>
              <dd>
                {{ hoveredNode.usedMemGb }}/{{ hoveredNode.totalMemGb }} GB
              </dd>
            </div>
          </dl>
        </div>

        <div v-if="selectedNode" class="node-detail-panel">
          <header>
            <div>
              <span
                :class="`status-dot status-dot--${normalizeStatus(selectedNode.status)}`"
              />
              <strong>{{ selectedNode.hostname }}</strong>
            </div>
            <button type="button" title="关闭" @click="selectedNode = null">
              <CloseOutlined />
            </button>
          </header>
          <dl>
            <div>
              <dt>IP 地址</dt>
              <dd>{{ selectedNode.ipAddress }}</dd>
            </div>
            <div>
              <dt>运行状态</dt>
              <dd :class="`status-${normalizeStatus(selectedNode.status)}`">
                {{ statusLabel(normalizeStatus(selectedNode.status)) }}
              </dd>
            </div>
            <div>
              <dt>CPU 使用率</dt>
              <dd>{{ selectedNode.cpuUsage }}%</dd>
            </div>
            <div>
              <dt>内存容量</dt>
              <dd>
                {{ selectedNode.usedMemGb }} / {{ selectedNode.totalMemGb }} GB
              </dd>
            </div>
          </dl>
          <button
            class="detail-link"
            type="button"
            @click="router.push(`/HOM/host/detail/${selectedNode.id}`)"
          >
            查看节点详情<RightOutlined />
          </button>
        </div>
      </section>

      <aside class="right-rail">
        <section class="cockpit-panel status-chart-panel">
          <header class="panel-heading">
            <span><CloudServerOutlined />设备状态</span>
            <small>{{ nodeTotal }} 台</small>
          </header>
          <VChart class="status-chart" :option="statusOption" autoresize />
        </section>

        <section class="cockpit-panel node-list-panel">
          <header class="panel-heading">
            <span><DatabaseOutlined />节点列表</span>
            <small>CPU</small>
          </header>
          <div class="node-list">
            <button
              v-for="node in dashboardNodes.slice(0, 7)"
              :key="node.id"
              class="node-row"
              type="button"
              @click="selectDashboardNode(node)"
            >
              <span class="node-name">
                <strong>{{ node.hostname }}</strong>
                <small>{{ node.ipAddress }}</small>
              </span>
              <span class="node-status" :class="`node-status--${node.status}`">
                {{ statusLabel(node.status) }}
              </span>
              <span class="node-usage">{{ node.cpuUsage }}%</span>
            </button>
          </div>
        </section>
      </aside>
    </section>

    <section class="bottom-grid">
      <article class="cockpit-panel trend-panel">
        <header class="panel-heading">
          <span><DashboardOutlined />资源负载趋势</span>
          <small>近 6 小时</small>
        </header>
        <VChart class="trend-chart" :option="trendOption" autoresize />
      </article>

      <article class="cockpit-panel capacity-panel">
        <header class="panel-heading">
          <span><DatabaseOutlined />资源分布</span>
          <small>按类型</small>
        </header>
        <VChart class="capacity-chart" :option="capacityOption" autoresize />
      </article>

      <article class="cockpit-panel event-panel">
        <header class="panel-heading">
          <span><ClockCircleOutlined />实时事件</span>
          <small>{{ lastUpdated }}</small>
        </header>
        <div class="event-list">
          <div
            v-for="event in events"
            :key="`${event.time}-${event.target}`"
            class="event-row"
          >
            <span :class="`event-marker event-marker--${event.level}`" />
            <span class="event-copy"
              ><strong>{{ event.target }}</strong
              ><small>{{ event.text }}</small></span
            >
            <time>{{ event.time }}</time>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.cluster-cockpit {
  --cockpit-bg: #eaf0f5;
  --cockpit-border: #d5e0e8;
  --cockpit-panel: rgb(255 255 255 / 94%);
  --cockpit-panel-muted: #f1f5f8;
  --cockpit-primary: #1677c8;
  --cockpit-primary-soft: rgb(22 119 200 / 12%);
  --cockpit-success: #16a773;
  --cockpit-warning: #d98213;
  --cockpit-error: #e5485d;
  --cockpit-text: #1d3345;
  --cockpit-text-muted: #6f8291;
  display: grid;
  min-height: calc(100dvh - 112px);
  grid-template-rows: auto minmax(520px, 1fr) 188px;
  gap: 10px;
  padding: 10px;
  color: var(--cockpit-text);
  background: var(--cockpit-bg);
  font-variant-numeric: tabular-nums;
}

.cluster-cockpit--dark {
  --cockpit-bg: #06111f;
  --cockpit-border: #173149;
  --cockpit-panel: rgb(8 25 40 / 94%);
  --cockpit-panel-muted: #0b2234;
  --cockpit-primary: #37a8ff;
  --cockpit-primary-soft: rgb(55 168 255 / 13%);
  --cockpit-success: #2fcf8c;
  --cockpit-warning: #ffae32;
  --cockpit-error: #ff5b6e;
  --cockpit-text: #dcecf7;
  --cockpit-text-muted: #7895aa;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.metric-card,
.cockpit-panel {
  border: 1px solid var(--cockpit-border);
  border-radius: 6px;
  background: var(--cockpit-panel);
  box-shadow: 0 8px 24px rgb(24 62 90 / 6%);
}

.cluster-cockpit--dark .metric-card,
.cluster-cockpit--dark .cockpit-panel {
  box-shadow: 0 10px 28px rgb(0 0 0 / 18%);
}

.metric-card {
  display: flex;
  min-width: 0;
  min-height: 80px;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
}

.metric-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid rgb(22 119 200 / 18%);
  border-radius: 6px;
  color: var(--cockpit-primary);
  background: var(--cockpit-primary-soft);
  font-size: 18px;
}

.metric-card--success .metric-icon {
  color: var(--cockpit-success);
  border-color: color-mix(in srgb, var(--cockpit-success) 24%, transparent);
  background: color-mix(in srgb, var(--cockpit-success) 12%, transparent);
}

.metric-card--warning .metric-icon {
  color: var(--cockpit-warning);
  border-color: color-mix(in srgb, var(--cockpit-warning) 24%, transparent);
  background: color-mix(in srgb, var(--cockpit-warning) 12%, transparent);
}

.metric-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.metric-label,
.metric-note {
  overflow: hidden;
  color: var(--cockpit-text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-value {
  color: var(--cockpit-text);
  font-size: 21px;
  font-weight: 650;
  line-height: 1.05;
}

.metric-value small {
  margin-left: 4px;
  color: var(--cockpit-text-muted);
  font-size: 10px;
  font-weight: 500;
}

.operations-grid {
  display: grid;
  min-height: 520px;
  grid-template-columns: minmax(190px, 0.8fr) minmax(520px, 3.2fr) minmax(
      230px,
      1fr
    );
  gap: 10px;
}

.left-rail,
.right-rail {
  display: grid;
  min-width: 0;
  gap: 10px;
}

.left-rail {
  grid-template-rows: minmax(0, 1fr) auto;
}

.right-rail {
  grid-template-rows: 200px minmax(0, 1fr);
}

.cockpit-panel {
  min-width: 0;
  overflow: hidden;
}

.panel-heading {
  display: flex;
  height: 42px;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--cockpit-border);
}

.panel-heading > span {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
}

.panel-heading :deep(.anticon) {
  color: var(--cockpit-primary);
}

.panel-heading small {
  color: var(--cockpit-text-muted);
  font-size: 10px;
  font-weight: 500;
}

.gauge-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 18px 12px 14px;
}

.gauge-item {
  display: grid;
  justify-items: center;
  gap: 7px;
}

.gauge-item > strong {
  color: var(--cockpit-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.health-gauge {
  position: relative;
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    var(--gauge-color) var(--gauge-value),
    var(--cockpit-panel-muted) 0
  );
}

.health-gauge::after {
  position: absolute;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--cockpit-panel);
  content: '';
}

.health-gauge span {
  position: relative;
  z-index: 1;
  color: var(--cockpit-text);
  font-size: 14px;
  font-weight: 650;
}

.health-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 0 12px 12px;
  gap: 8px;
}

.health-facts > div {
  display: grid;
  min-width: 0;
  gap: 3px;
  padding: 9px;
  border: 1px solid var(--cockpit-border);
  border-radius: 5px;
  background: var(--cockpit-panel-muted);
}

.health-facts dt {
  overflow: hidden;
  color: var(--cockpit-text-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.health-facts dd {
  margin: 0;
  color: var(--cockpit-text);
  font-size: 13px;
  font-weight: 650;
}

.alert-summary {
  display: grid;
  gap: 2px;
  padding: 8px 12px 12px;
}

.alert-summary > div {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 7px 2px;
  color: var(--cockpit-text-muted);
  font-size: 11px;
}

.alert-summary strong {
  color: var(--cockpit-text);
}

.scene-stage {
  position: relative;
  min-width: 0;
  min-height: 520px;
  overflow: hidden;
  border: 1px solid var(--cockpit-border);
  border-radius: 6px;
  background: #06111f;
}

.scene-container,
.scene-container :deep(canvas) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.scene-command-bar {
  position: absolute;
  z-index: 12;
  top: 10px;
  right: 10px;
  left: 10px;
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 8px 7px 11px;
  border: 1px solid rgb(118 185 231 / 20%);
  border-radius: 6px;
  color: #dff4ff;
  background: rgb(5 20 34 / 82%);
  backdrop-filter: blur(12px);
}

.scene-identity,
.scene-controls,
.view-switch {
  display: flex;
  align-items: center;
}

.scene-identity {
  min-width: 0;
  gap: 9px;
}

.scene-identity > div {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.scene-identity strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-identity small {
  color: #7697ad;
  font-size: 9px;
}

.live-indicator {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #2fcf8c;
  box-shadow: 0 0 0 4px rgb(47 207 140 / 12%);
}

.scene-controls {
  min-width: 0;
  gap: 6px;
}

.cluster-select,
.demo-cluster-name {
  height: 30px;
  max-width: 146px;
  border: 1px solid #234963;
  border-radius: 4px;
  color: #cde9fa;
  background: #0b263b;
  font-size: 11px;
}

.cluster-select {
  padding: 0 25px 0 9px;
  outline: none;
}

.demo-cluster-name {
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  white-space: nowrap;
}

.view-switch {
  height: 30px;
  overflow: hidden;
  border: 1px solid #234963;
  border-radius: 4px;
  background: #0b263b;
}

.view-switch button,
.icon-button {
  display: inline-flex;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 0;
  color: #789bb2;
  background: transparent;
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.view-switch button {
  gap: 5px;
  padding: 0 9px;
  font-size: 10px;
}

.view-switch button + button {
  border-left: 1px solid #234963;
}

.view-switch button.active,
.icon-button.active,
.view-switch button:hover,
.icon-button:hover {
  color: #ecf8ff;
  background: #116eb5;
}

.icon-button {
  width: 30px;
  flex: 0 0 30px;
  border: 1px solid #234963;
  border-radius: 4px;
  font-size: 13px;
}

.spinning {
  animation: rotate 0.8s linear infinite;
}

.scene-loading {
  position: absolute;
  z-index: 15;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgb(4 15 26 / 42%);
  pointer-events: none;
}

.scene-loading span {
  width: 4px;
  height: 22px;
  border-radius: 2px;
  background: #37a8ff;
  animation: loading-bars 0.8s ease-in-out infinite alternate;
}

.scene-loading span:nth-child(2) {
  animation-delay: 120ms;
}
.scene-loading span:nth-child(3) {
  animation-delay: 240ms;
}

.scene-legend {
  position: absolute;
  z-index: 8;
  right: 12px;
  bottom: 10px;
  left: 12px;
  display: flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 6px 10px;
  border: 1px solid rgb(118 185 231 / 16%);
  border-radius: 5px;
  color: #89a8bc;
  background: rgb(5 20 34 / 74%);
  font-size: 9px;
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.scene-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.legend-line {
  width: 18px;
  height: 2px;
}

.legend-line--primary {
  background: #37a8ff;
}
.legend-line--warning {
  background: #ffae32;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-dot--online {
  background: #2fcf8c;
}
.legend-dot--error {
  background: #ff5b6e;
}

.node-tooltip,
.node-detail-panel {
  position: absolute;
  z-index: 16;
  border: 1px solid rgb(55 168 255 / 42%);
  border-radius: 6px;
  color: #cde7f7;
  background: rgb(5 22 37 / 94%);
  box-shadow: 0 14px 34px rgb(0 0 0 / 30%);
  backdrop-filter: blur(12px);
}

.node-tooltip {
  width: 214px;
  padding: 10px 11px;
  pointer-events: none;
}

.node-tooltip header {
  margin-bottom: 7px;
  color: #f1f9ff;
  font-size: 12px;
  font-weight: 650;
}

.node-tooltip dl,
.node-detail-panel dl {
  display: grid;
  margin: 0;
  gap: 5px;
}

.node-tooltip dl > div,
.node-detail-panel dl > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.node-tooltip dt,
.node-detail-panel dt {
  color: #7292a7;
  font-size: 10px;
}

.node-tooltip dd,
.node-detail-panel dd {
  overflow: hidden;
  margin: 0;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-detail-panel {
  top: 68px;
  right: 12px;
  width: min(260px, calc(100% - 24px));
  overflow: hidden;
}

.node-detail-panel > header {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 12px;
  border-bottom: 1px solid #1b3b51;
}

.node-detail-panel > header > div {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.node-detail-panel > header strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-detail-panel > header button {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border: 0;
  color: #7798ad;
  background: transparent;
  cursor: pointer;
}

.node-detail-panel > dl {
  padding: 11px 12px;
}

.detail-link {
  display: flex;
  width: 100%;
  height: 34px;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border: 0;
  border-top: 1px solid #1b3b51;
  color: #64beff;
  background: rgb(55 168 255 / 7%);
  cursor: pointer;
  font-size: 10px;
}

.status-chart,
.trend-chart,
.capacity-chart {
  width: 100%;
}

.status-chart {
  height: 157px;
}

.node-list {
  display: grid;
  padding: 3px 0;
}

.node-row {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) 42px 34px;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 0;
  border-bottom: 1px solid var(--cockpit-border);
  color: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 160ms ease;
}

.node-row:last-child {
  border-bottom: 0;
}
.node-row:hover {
  background: var(--cockpit-primary-soft);
}

.node-name {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.node-name strong,
.node-name small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-name strong {
  font-size: 11px;
  font-weight: 600;
}
.node-name small {
  color: var(--cockpit-text-muted);
  font-size: 9px;
}

.node-status {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 9px;
  text-align: center;
}

.node-status--online {
  color: var(--cockpit-success);
  background: color-mix(in srgb, var(--cockpit-success) 12%, transparent);
}
.node-status--warning {
  color: var(--cockpit-warning);
  background: color-mix(in srgb, var(--cockpit-warning) 12%, transparent);
}
.node-status--error {
  color: var(--cockpit-error);
  background: color-mix(in srgb, var(--cockpit-error) 12%, transparent);
}
.node-status--offline {
  color: var(--cockpit-text-muted);
  background: var(--cockpit-panel-muted);
}

.node-usage {
  color: var(--cockpit-text-muted);
  font-size: 10px;
  text-align: right;
}

.bottom-grid {
  display: grid;
  min-height: 188px;
  grid-template-columns: minmax(0, 1.35fr) minmax(210px, 0.7fr) minmax(
      260px,
      1fr
    );
  gap: 10px;
}

.trend-chart,
.capacity-chart {
  height: 145px;
}

.event-list {
  display: grid;
  padding: 4px 10px;
}

.event-row {
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 2px;
}

.event-marker {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.event-marker--online {
  background: var(--cockpit-success);
}
.event-marker--warning {
  background: var(--cockpit-warning);
}
.event-marker--error {
  background: var(--cockpit-error);
}

.event-copy {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.event-copy strong,
.event-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-copy strong {
  font-size: 10px;
  font-weight: 600;
}
.event-copy small {
  color: var(--cockpit-text-muted);
  font-size: 9px;
}
.event-row time {
  color: var(--cockpit-text-muted);
  font-size: 9px;
}

.status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
}

.status-dot--online {
  background: var(--cockpit-success);
}
.status-dot--warning {
  background: var(--cockpit-warning);
}
.status-dot--error {
  background: var(--cockpit-error);
}
.status-dot--offline {
  background: var(--cockpit-text-muted);
}
.status-online {
  color: var(--cockpit-success) !important;
}
.status-warning {
  color: var(--cockpit-warning) !important;
}
.status-error {
  color: var(--cockpit-error) !important;
}
.status-offline {
  color: var(--cockpit-text-muted) !important;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes loading-bars {
  from {
    transform: scaleY(0.45);
    opacity: 0.45;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (max-width: 1380px) {
  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .operations-grid {
    grid-template-columns: minmax(180px, 0.72fr) minmax(480px, 2.8fr) minmax(
        220px,
        1fr
      );
  }
  .scene-command-bar {
    align-items: flex-start;
  }
  .scene-controls {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

@media (max-width: 1100px) {
  .cluster-cockpit {
    grid-template-rows: auto auto auto;
  }
  .operations-grid {
    grid-template-areas: 'scene scene' 'left right';
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .left-rail {
    grid-area: left;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
  }
  .scene-stage {
    grid-area: scene;
    min-height: 560px;
  }
  .right-rail {
    grid-area: right;
    grid-template-rows: 200px auto;
  }
  .bottom-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .event-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .cluster-cockpit {
    padding: 8px;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .metric-card {
    min-height: 76px;
    padding: 10px;
  }
  .metric-icon {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
  }
  .metric-value {
    font-size: 18px;
  }
  .operations-grid {
    display: flex;
    flex-direction: column;
  }
  .scene-stage {
    order: -1;
    min-height: 500px;
  }
  .left-rail,
  .right-rail,
  .bottom-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .scene-command-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .scene-controls {
    justify-content: flex-start;
  }
  .scene-identity small {
    display: none;
  }
  .demo-cluster-name,
  .cluster-select {
    max-width: 132px;
  }
  .scene-legend {
    gap: 8px;
    justify-content: space-between;
  }
  .scene-legend span {
    gap: 4px;
  }
  .node-detail-panel {
    top: 116px;
  }
  .event-panel {
    grid-column: auto;
  }
}

@media (max-width: 430px) {
  .metrics-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .scene-stage {
    min-height: 520px;
  }
  .view-switch button span {
    display: none;
  }
  .scene-legend span:nth-child(n + 3) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning,
  .scene-loading span {
    animation: none;
  }
  .node-row,
  .view-switch button,
  .icon-button {
    transition: none;
  }
}
</style>
