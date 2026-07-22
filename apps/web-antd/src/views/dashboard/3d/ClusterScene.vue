<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import * as THREE from 'three';
import { useThreeScene } from './composables/useThreeScene';
import { useClusterData } from './composables/useClusterData';
import { useInteraction } from './composables/useInteraction';
import { createServerRack } from './components/ServerRack';
import { createServerNode } from './components/ServerNode';
import { createNetworkLines } from './components/NetworkTopology';
import { RACK_GAP, ROW_GAP, RACK_HEIGHT } from './constants';

const containerRef = ref<HTMLElement | null>(null);
const { scene, camera, init } = useThreeScene();
const { rackGroups, clusters, selectedClusterId, loading, loadData, switchCluster } = useClusterData();
const { hoveredNode, selectedNode, onMouseMove, onClick } = useInteraction(camera, scene);

// 存储当前3D对象以便清理
const sceneObjects = ref<THREE.Object3D[]>([]);

function clearScene() {
  for (const obj of sceneObjects.value) {
    scene.remove(obj);
  }
  sceneObjects.value = [];
}

function buildScene() {
  clearScene();

  const rackPositions: THREE.Vector3[] = [];
  const racksPerRow = 5;

  rackGroups.value.forEach((rackGroup, index) => {
    const row = Math.floor(index / racksPerRow);
    const col = index % racksPerRow;
    const x = (col - Math.floor(racksPerRow / 2)) * RACK_GAP;
    const z = row * ROW_GAP;

    // 创建机架
    const rack = createServerRack(rackGroup.rackName);
    rack.position.set(x, 0, z);
    scene.add(rack);
    sceneObjects.value.push(rack);
    rackPositions.push(new THREE.Vector3(x, 0, z));

    // 在机架内创建服务器节点
    rackGroup.hosts.forEach((host, slotIndex) => {
      const node = createServerNode({
        id: host.id,
        hostname: host.hostname,
        ipAddress: host.ipAddress,
        status: host.status || 'unknown',
        cpuUsage: Number(host.cpuUsage || 0),
        usedMemGb: Number(host.usedMemGb || 0),
        totalMemGb: Number(host.totalMemGb || 0),
      }, slotIndex);
      rack.add(node);
    });
  });

  // 如果没有数据，创建演示场景
  if (rackGroups.value.length === 0) {
    buildDemoScene(rackPositions);
  }

  // 网络拓扑连线
  if (rackPositions.length > 1) {
    const networkLines = createNetworkLines(rackPositions);
    scene.add(networkLines);
    sceneObjects.value.push(networkLines);
  }
}

function buildDemoScene(rackPositions: THREE.Vector3[]) {
  const demoRacks = ['Rack-A1', 'Rack-A2', 'Rack-A3', 'Rack-B1', 'Rack-B2'];
  const statuses = ['online', 'online', 'online', 'warning', 'error', 'offline', 'online', 'online'];

  demoRacks.forEach((rackName, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const x = (col - 2) * RACK_GAP;
    const z = row * ROW_GAP;

    const rack = createServerRack(rackName);
    rack.position.set(x, 0, z);
    scene.add(rack);
    sceneObjects.value.push(rack);
    rackPositions.push(new THREE.Vector3(x, 0, z));

    // 每个机架放 3-6 个节点
    const nodeCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < nodeCount; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)]!;
      const node = createServerNode({
        id: index * 10 + i,
        hostname: `node-${rackName.toLowerCase()}-${i + 1}`,
        ipAddress: `198.51.100.${100 + index * 10 + i}`,
        status,
        cpuUsage: Math.round(Math.random() * 100),
        usedMemGb: Math.round(Math.random() * 64),
        totalMemGb: 64,
      }, i);
      rack.add(node);
    }
  });
}

function handleMouseMove(event: MouseEvent) {
  if (containerRef.value) {
    onMouseMove(event, containerRef.value);
  }
}

function handleClick(event: MouseEvent) {
  if (containerRef.value) {
    onClick(event, containerRef.value);
  }
}

watch(rackGroups, () => {
  buildScene();
});

onMounted(async () => {
  if (containerRef.value) {
    init(containerRef.value);
    await loadData();
    buildScene();
  }
});
</script>

<template>
  <div class="cluster-scene-wrapper">
    <!-- 顶部工具栏 -->
    <div class="scene-toolbar">
      <select
        v-if="clusters.length > 0"
        :value="selectedClusterId"
        @change="switchCluster(Number(($event.target as HTMLSelectElement).value))"
        class="cluster-select"
      >
        <option v-for="c in clusters" :key="c.id" :value="c.id">
          {{ c.clusterName }}
        </option>
      </select>
      <span v-if="loading" class="loading-text">Loading...</span>
      <span v-else-if="clusters.length === 0" class="loading-text">演示模式 (无集群数据)</span>
    </div>

    <!-- 3D 场景容器 -->
    <div
      ref="containerRef"
      class="scene-container"
      @mousemove="handleMouseMove"
      @click="handleClick"
    />

    <!-- 悬浮提示 -->
    <div
      v-if="hoveredNode"
      class="node-tooltip"
      :style="{ left: hoveredNode.screenX + 20 + 'px', top: hoveredNode.screenY - 10 + 'px' }"
    >
      <div class="tooltip-title">{{ hoveredNode.hostname }}</div>
      <div>IP: {{ hoveredNode.ipAddress }}</div>
      <div>
        Status:
        <span :class="'status-' + hoveredNode.status">{{ hoveredNode.status }}</span>
      </div>
      <div>CPU: {{ hoveredNode.cpuUsage }}%</div>
      <div>MEM: {{ hoveredNode.usedMemGb }}/{{ hoveredNode.totalMemGb }} GB</div>
    </div>

    <!-- 点击详情面板 -->
    <div v-if="selectedNode" class="node-detail-panel">
      <div class="panel-header">
        <span>{{ selectedNode.hostname }}</span>
        <button class="panel-close" @click="selectedNode = null">x</button>
      </div>
      <div class="panel-body">
        <div class="panel-row"><label>IP地址:</label><span>{{ selectedNode.ipAddress }}</span></div>
        <div class="panel-row">
          <label>状态:</label>
          <span :class="'status-' + selectedNode.status">{{ selectedNode.status }}</span>
        </div>
        <div class="panel-row"><label>CPU使用率:</label><span>{{ selectedNode.cpuUsage }}%</span></div>
        <div class="panel-row"><label>内存:</label><span>{{ selectedNode.usedMemGb }} / {{ selectedNode.totalMemGb }} GB</span></div>
        <a
          class="panel-link"
          @click="$router.push(`/HOM/host/detail/${selectedNode.id}`)"
        >
          查看完整详情 →
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cluster-scene-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: #1a1a2e;
}

.scene-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cluster-select {
  background: rgba(30, 30, 60, 0.9);
  color: #00ccff;
  border: 1px solid #334;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  outline: none;
}

.loading-text {
  color: #888;
  font-size: 13px;
}

.scene-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.node-tooltip {
  position: absolute;
  z-index: 20;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid #00aaff;
  border-radius: 6px;
  padding: 8px 12px;
  color: #ccc;
  font-size: 12px;
  pointer-events: none;
  min-width: 180px;
}

.tooltip-title {
  color: #00ccff;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
}

.node-detail-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  z-index: 20;
  background: rgba(20, 20, 45, 0.95);
  border: 1px solid #334;
  border-radius: 8px;
  width: 280px;
  color: #ccc;
  font-size: 13px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #334;
  color: #00ccff;
  font-weight: bold;
}

.panel-close {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
}

.panel-body {
  padding: 10px 14px;
}

.panel-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.panel-row label {
  color: #888;
}

.panel-link {
  display: block;
  margin-top: 10px;
  color: #00aaff;
  cursor: pointer;
  text-align: center;
}

.panel-link:hover {
  text-decoration: underline;
}

.status-online { color: #52c41a; }
.status-warning { color: #faad14; }
.status-error { color: #ff4d4f; }
.status-offline { color: #8c8c8c; }
.status-unknown { color: hsl(var(--muted-foreground)); }
</style>
