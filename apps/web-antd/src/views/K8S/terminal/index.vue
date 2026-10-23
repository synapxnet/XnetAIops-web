<script lang="ts" setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  nextTick,
} from 'vue';
import {
  Card,
  Select,
  SelectOption,
  Space,
  Button,
  message,
} from 'ant-design-vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import { getPods } from '../api/pod';
import { requestTerminalTicket, terminalSocketUrl } from '../api/terminal';
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
const connecting = ref(false);
let disposed = false;
let namespaceGeneration = 0;
let podGeneration = 0;
let terminalGeneration = 0;
let resizeObserver: ResizeObserver | null = null;

let ws: WebSocket | null = null;
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
const terminalRef = ref<HTMLDivElement | null>(null);

/** 初始化终端并由真实WebSocket传输输入。Initialize the terminal and transmit input through the real WebSocket. */
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

/** 加载已配置集群，离页后忽略响应。Load configured clusters and ignore responses after leaving the page. */
async function fetchClusters() {
  try {
    const res = await getClusters();
    if (disposed) return;
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

/** 清空级联选择，防止旧集群响应覆盖新集群。Clear dependent selections and reject stale cluster responses. */
async function fetchNamespaces() {
  const generation = ++namespaceGeneration;
  ++podGeneration;
  disconnectTerminal();
  namespaces.value = [];
  selectedNamespace.value = '';
  pods.value = [];
  selectedPod.value = '';
  containers.value = [];
  selectedContainer.value = '';
  if (!selectedClusterId.value) return;
  const clusterId = selectedClusterId.value;
  try {
    const res = await getNamespaces(clusterId);
    if (
      disposed ||
      generation !== namespaceGeneration ||
      clusterId !== selectedClusterId.value
    )
      return;
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    selectedNamespace.value = namespaces.value.includes('default')
      ? 'default'
      : namespaces.value[0] || '';
    fetchPods();
  } catch {
    if (disposed || generation !== namespaceGeneration) return;
    message.error('获取命名空间失败');
  }
}

/** 切换命名空间时断开旧会话并仅接纳最新Pod列表。Disconnect old sessions on namespace changes and accept only the latest pod list. */
async function fetchPods() {
  const generation = ++podGeneration;
  disconnectTerminal();
  pods.value = [];
  selectedPod.value = '';
  containers.value = [];
  selectedContainer.value = '';
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  const clusterId = selectedClusterId.value;
  const namespace = selectedNamespace.value;
  try {
    const res = await getPods(clusterId, namespace);
    if (
      disposed ||
      generation !== podGeneration ||
      clusterId !== selectedClusterId.value ||
      namespace !== selectedNamespace.value
    )
      return;
    pods.value = Array.isArray(res) ? res : [];
    if (pods.value.length > 0) {
      selectedPod.value = pods.value[0].name;
      updateContainers();
    }
  } catch {
    if (disposed || generation !== podGeneration) return;
    message.error('获取Pod列表失败');
  }
}

/** 更换Pod时结束旧会话并重新选择容器。End the old session and reselect containers when the pod changes. */
function updateContainers() {
  disconnectTerminal();
  const pod = pods.value.find((p) => p.name === selectedPod.value);
  if (pod && pod.containers) {
    containers.value = pod.containers.map((c: any) => c.name || c);
    selectedContainer.value = containers.value[0] || '';
  } else {
    containers.value = [];
    selectedContainer.value = '';
  }
}

/** 连接明确选择的资源，旧连接回调不得改变新会话。Connect the selected resource and prevent old callbacks from changing the new session. */
async function connectTerminal() {
  if (connecting.value) return;
  if (
    !selectedClusterId.value ||
    !selectedNamespace.value ||
    !selectedPod.value ||
    !selectedContainer.value
  ) {
    message.warning('请选择Pod');
    return;
  }

  disconnectTerminal();
  const generation = terminalGeneration;
  connecting.value = true;
  let socket: WebSocket;
  try {
    const ticket = await requestTerminalTicket({
      clusterId: selectedClusterId.value,
      namespace: selectedNamespace.value,
      podName: selectedPod.value,
      containerName: selectedContainer.value,
    });
    if (disposed || generation !== terminalGeneration) return;
    socket = new WebSocket(terminalSocketUrl(ticket), [
      'synapxnet-terminal',
      'ticket.' + ticket.ticket,
    ]);
  } catch {
    if (generation === terminalGeneration) {
      connecting.value = false;
      message.error('无法取得终端连接许可，请检查登录、组织及容器执行权限。');
    }
    return;
  }

  if (terminal) {
    terminal.clear();
    terminal.writeln(`\x1b[32m连接到 ${selectedPod.value}...\x1b[0m`);
  }

  ws = socket;
  connecting.value = true;

  /** 只有当前连接真实打开后显示已连接。Show connected only after the current socket actually opens. */
  socket.onopen = () => {
    if (ws !== socket || disposed) {
      socket.close();
      return;
    }
    connecting.value = false;
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

  /** 只显示当前会话的数据。Display data from the current session only. */
  socket.onmessage = (event) => {
    if (ws === socket && terminal) {
      terminal.write(event.data);
    }
  };

  /** 关闭事件仅更新其所属的当前会话。Apply close events to their own current session only. */
  socket.onclose = () => {
    if (ws !== socket) return;
    connecting.value = false;
    connected.value = false;
    if (terminal) {
      terminal.writeln('\r\n\x1b[31m--- 连接已断开 ---\x1b[0m');
    }
  };

  /** 当前连接失败后释放连接中状态。Release the pending state when the current connection fails. */
  socket.onerror = () => {
    if (ws !== socket) return;
    connecting.value = false;
    message.error('终端连接失败');
    connected.value = false;
  };
}

/** 先失效旧连接，再关闭它，防止迟到关闭事件。Invalidate the old socket before closing it to prevent late close events. */
function disconnectTerminal() {
  ++terminalGeneration;
  const previous = ws;
  ws = null;
  connected.value = false;
  connecting.value = false;
  previous?.close();
}

/** 清空显示而不发送执行命令。Clear the display without sending execution commands. */
function clearTerminal() {
  if (terminal) {
    terminal.clear();
  }
}

/** 容器改变大小时重算终端尺寸。Refit terminal dimensions when the container changes size. */
function handleResize() {
  if (fitAddon) {
    try {
      fitAddon.fit();
    } catch {
      // ignore fit errors during unmount
    }
  }
}

/** 建立界面和尺寸监听，不自动连接终端。Initialize the view and resize observer without automatically connecting. */
onMounted(() => {
  fetchClusters();
  nextTick(() => {
    initTerminal();
    if (terminalRef.value) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(terminalRef.value);
    }
  });
  window.addEventListener('resize', handleResize);
  window.addEventListener(
    'synapxnet:organization-scope-changed',
    organizationChanged,
  );
});

/** 离页失效请求并释放终端和观察器。Invalidate requests and release terminal resources on leaving the page. */
onBeforeUnmount(() => {
  disposed = true;
  ++namespaceGeneration;
  ++podGeneration;
  resizeObserver?.disconnect();
  disconnectTerminal();
  window.removeEventListener('resize', handleResize);
  window.removeEventListener(
    'synapxnet:organization-scope-changed',
    organizationChanged,
  );
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }
});
/** 缓存页恢复时重新允许读取并适配显示尺寸。Resume reads and refit the display when a cached page is activated. */
onActivated(() => {
  disposed = false;
  nextTick(handleResize);
});
/** 切换到其他页时结束终端会话并丢弃迟到请求。End the terminal session and discard late requests when switching away. */
onDeactivated(() => {
  disposed = true;
  ++namespaceGeneration;
  ++podGeneration;
  disconnectTerminal();
});
/** 组织改变后立即断开终端，清理跨范围资源选择。Disconnect immediately and clear cross-scope selections when the organization changes. */
function organizationChanged() {
  disconnectTerminal();
  ++namespaceGeneration;
  ++podGeneration;
  clusters.value = [];
  selectedClusterId.value = null;
  namespaces.value = [];
  selectedNamespace.value = '';
  pods.value = [];
  selectedPod.value = '';
  containers.value = [];
  selectedContainer.value = '';
  if (!disposed) fetchClusters();
}
</script>

<template>
  <BusinessPage
    title="终端"
    description="先选择集群、命名空间与容器，再建立真实终端会话。"
    family="终端"
    route-key="/K8S/terminal/index"
  >
    <div class="p-4">
      <Card title="终端 (Terminal)">
        <template #extra>
          <Space>
            <Select
              :value="selectedClusterId ?? undefined"
              style="width: 150px"
              placeholder="集群"
              @change="
                (v) => {
                  selectedClusterId = typeof v === 'number' ? v : null;
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
                (v) => {
                  selectedNamespace = typeof v === 'string' ? v : '';
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
                (v) => {
                  selectedPod = typeof v === 'string' ? v : '';
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
                (v) => {
                  disconnectTerminal();
                  selectedContainer = typeof v === 'string' ? v : '';
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
              :loading="connecting"
              :disabled="!selectedContainer"
              @click="connectTerminal"
            >
              连接
            </Button>
            <Button v-else danger @click="disconnectTerminal">断开</Button>
            <Button @click="clearTerminal">清屏</Button>
          </Space>
        </template>
        <div ref="terminalRef" class="terminal-container" />
      </Card>
    </div>
  </BusinessPage>
</template>

<style scoped>
.terminal-container {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 8px;
  min-height: 320px;
  height: calc(100dvh - 350px);
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

.terminal-container :deep(.xterm-viewport) {
  border-radius: 4px;
}
</style>
