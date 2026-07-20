<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { Card, Select, SelectOption, Space, Button, message } from 'ant-design-vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import { getPods } from '../api/pod';
import type { K8sCluster } from '../api/types';

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const namespaces = ref<string[]>([]);
const selectedNamespace = ref('');
const pods = ref<any[]>([]);
const selectedPod = ref('');
const containers = ref<string[]>([]);
const selectedContainer = ref('');
const connected = ref(false);

let ws: WebSocket | null = null;
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
const terminalRef = ref<HTMLDivElement | null>(null);

function initTerminal() {
  if (terminal || !terminalRef.value) return;

  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 14,
    fontFamily: "'Cascadia Code', 'Consolas', 'Courier New', monospace",
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      selectionBackground: '#264f78',
      black: '#1e1e1e',
      red: '#f44747',
      green: '#6a9955',
      yellow: '#dcdcaa',
      blue: '#569cd6',
      magenta: '#c586c0',
      cyan: '#4ec9b0',
      white: '#d4d4d4',
      brightBlack: '#808080',
      brightRed: '#f44747',
      brightGreen: '#6a9955',
      brightYellow: '#dcdcaa',
      brightBlue: '#569cd6',
      brightMagenta: '#c586c0',
      brightCyan: '#4ec9b0',
      brightWhite: '#ffffff',
    },
    allowProposedApi: true,
    scrollback: 5000,
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(new WebLinksAddon());

  terminal.open(terminalRef.value);
  fitAddon.fit();

  terminal.writeln('\x1b[36m欢迎使用 K8S Web Terminal\x1b[0m');
  terminal.writeln('\x1b[90m请选择Pod并点击"连接"按钮启动终端会话...\x1b[0m');
  terminal.writeln('');

  // Send input to WebSocket
  terminal.onData((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  // Handle resize
  terminal.onResize(({ cols, rows }) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  });
}

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter((c) => c.status === 'active');
    if (active.length > 0) {
      selectedClusterId.value = active[0]!.id;
      await fetchNamespaces();
    }
  } catch {
    message.error('获取集群列表失败');
  }
}

async function fetchNamespaces() {
  if (!selectedClusterId.value) return;
  try {
    const res = await getNamespaces(selectedClusterId.value);
    namespaces.value = (Array.isArray(res) ? res : []).map(
      (n: any) => n.name,
    );
    selectedNamespace.value = namespaces.value.includes('default')
      ? 'default'
      : namespaces.value[0] || '';
    fetchPods();
  } catch {
    message.error('获取命名空间失败');
  }
}

async function fetchPods() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  try {
    const res = await getPods(
      selectedClusterId.value,
      selectedNamespace.value,
    );
    pods.value = Array.isArray(res) ? res : [];
    if (pods.value.length > 0) {
      selectedPod.value = pods.value[0].name;
      updateContainers();
    }
  } catch {
    message.error('获取Pod列表失败');
  }
}

function updateContainers() {
  const pod = pods.value.find((p) => p.name === selectedPod.value);
  if (pod && pod.containers) {
    containers.value = pod.containers.map((c: any) => c.name || c);
    selectedContainer.value = containers.value[0] || '';
  } else {
    containers.value = [];
    selectedContainer.value = '';
  }
}

function connectTerminal() {
  if (!selectedClusterId.value || !selectedPod.value) {
    message.warning('请选择Pod');
    return;
  }

  disconnectTerminal();

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = '9186';
  const containerPath = selectedContainer.value
    ? `/${selectedContainer.value}`
    : '';
  const url = `${protocol}//${host}:${port}/ws/terminal/${selectedClusterId.value}/${selectedNamespace.value}/${selectedPod.value}${containerPath}`;

  if (terminal) {
    terminal.clear();
    terminal.writeln(`\x1b[32m连接到 ${selectedPod.value}...\x1b[0m`);
  }

  ws = new WebSocket(url);

  ws.onopen = () => {
    connected.value = true;
    message.success('终端已连接');
    // Send initial resize
    if (terminal && ws) {
      ws.send(
        JSON.stringify({
          type: 'resize',
          cols: terminal.cols,
          rows: terminal.rows,
        }),
      );
    }
  };

  ws.onmessage = (event) => {
    if (terminal) {
      terminal.write(event.data);
    }
  };

  ws.onclose = () => {
    connected.value = false;
    if (terminal) {
      terminal.writeln('\r\n\x1b[31m--- 连接已断开 ---\x1b[0m');
    }
  };

  ws.onerror = () => {
    message.error('终端连接失败');
    connected.value = false;
  };
}

function disconnectTerminal() {
  if (ws) {
    ws.close();
    ws = null;
    connected.value = false;
  }
}

function clearTerminal() {
  if (terminal) {
    terminal.clear();
  }
}

function handleResize() {
  if (fitAddon) {
    try {
      fitAddon.fit();
    } catch {
      // ignore fit errors during unmount
    }
  }
}

onMounted(() => {
  fetchClusters();
  nextTick(() => {
    initTerminal();
  });
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  disconnectTerminal();
  window.removeEventListener('resize', handleResize);
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
});
</script>

<template>
  <div class="p-4">
    <Card title="终端 (Terminal)">
      <template #extra>
        <Space>
          <Select
            :value="selectedClusterId"
            style="width: 150px"
            placeholder="集群"
            @change="
              (v: number) => {
                selectedClusterId = v;
                fetchNamespaces();
              }
            "
          >
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{
              c.name
            }}</SelectOption>
          </Select>
          <Select
            :value="selectedNamespace"
            style="width: 150px"
            placeholder="命名空间"
            @change="
              (v: string) => {
                selectedNamespace = v;
                fetchPods();
              }
            "
          >
            <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{
              ns
            }}</SelectOption>
          </Select>
          <Select
            :value="selectedPod"
            style="width: 220px"
            placeholder="Pod"
            show-search
            @change="
              (v: string) => {
                selectedPod = v;
                updateContainers();
              }
            "
          >
            <SelectOption v-for="p in pods" :key="p.name" :value="p.name">
              <span>{{ p.name }}</span>
              <span
                v-if="p.status"
                :style="{
                  color:
                    p.status === 'Running'
                      ? '#52c41a'
                      : p.status === 'Pending'
                        ? '#faad14'
                        : '#ff4d4f',
                  marginLeft: '6px',
                  fontSize: '12px',
                }"
              >
                {{ p.status }}
              </span>
            </SelectOption>
          </Select>
          <Select
            v-if="containers.length > 1"
            :value="selectedContainer"
            style="width: 150px"
            placeholder="容器"
            @change="
              (v: string) => {
                selectedContainer = v;
              }
            "
          >
            <SelectOption v-for="c in containers" :key="c" :value="c">{{
              c
            }}</SelectOption>
          </Select>
          <Button
            v-if="!connected"
            type="primary"
            @click="connectTerminal"
          >
            连接
          </Button>
          <Button v-else danger @click="disconnectTerminal">断开</Button>
          <Button @click="clearTerminal">清屏</Button>
        </Space>
      </template>
      <div
        ref="terminalRef"
        class="terminal-container"
      />
    </Card>
  </div>
</template>

<style scoped>
.terminal-container {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 8px;
  min-height: 520px;
  height: calc(100vh - 260px);
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

.terminal-container :deep(.xterm-viewport) {
  border-radius: 4px;
}
</style>
