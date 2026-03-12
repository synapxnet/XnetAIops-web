<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Row,
  Col,
  Tag,
  Table,
  Progress,
  Descriptions,
  DescriptionsItem,
  Select,
  SelectOption,
  Tabs,
  TabPane,
  Button,
  Space,
  Badge,
  Spin,
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Textarea,
  message,
} from 'ant-design-vue';
import {
  getCluster,
  getClusterOverview,
  getClusterComponents,
  getClusterEvents,
  getNodeRanking,
  updateClusterSsh,
} from '../api/cluster';
import type {
  K8sClusterOverview,
  K8sClusterComponent,
  K8sEvent,
  K8sNodeRanking,
} from '../api/types';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.id);

const loading = ref(true);
const overview = ref<K8sClusterOverview | null>(null);
const components = ref<K8sClusterComponent[]>([]);
const events = ref<K8sEvent[]>([]);
const nodeRanking = ref<K8sNodeRanking[]>([]);
const rankingSortBy = ref('cpu');

const cpuPercent = computed(() => {
  if (!overview.value || !overview.value.cpuCapacity) return 0;
  return Math.round((overview.value.cpuUsed / overview.value.cpuCapacity) * 100);
});
const memoryPercent = computed(() => {
  if (!overview.value || !overview.value.memoryCapacity) return 0;
  return Math.round((overview.value.memoryUsed / overview.value.memoryCapacity) * 100);
});
const podPercent = computed(() => {
  if (!overview.value || !overview.value.podCapacity) return 0;
  return Math.round((overview.value.podUsed / overview.value.podCapacity) * 100);
});
const storagePercent = computed(() => {
  if (!overview.value || !overview.value.storageCapacity || !overview.value.storageUsed) return 0;
  return Math.round((overview.value.storageUsed / overview.value.storageCapacity) * 100);
});

function formatBytes(bytes: number): string {
  if (!bytes) return '0';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex++; }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatCpu(cores: number): string {
  if (!cores) return '0';
  return cores.toFixed(2);
}

const healthyComponents = computed(() => components.value.filter((c) => c.status === 'healthy').length);
const totalComponents = computed(() => components.value.length);

const rankingColumns = [
  { title: '排名', key: 'rank', width: 60 },
  { title: '节点', dataIndex: 'name', key: 'name' },
  { title: 'CPU', dataIndex: 'cpuPercent', key: 'cpu', width: 140 },
  { title: '内存', dataIndex: 'memoryPercent', key: 'memory', width: 140 },
  { title: 'Pod', dataIndex: 'podPercent', key: 'pod', width: 140 },
];

const eventColumns = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '资源', key: 'resource', width: 200 },
  { title: '原因', dataIndex: 'reason', key: 'reason', width: 140 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '次数', dataIndex: 'count', key: 'count', width: 60 },
  { title: '时间', dataIndex: 'lastTimestamp', key: 'lastTimestamp', width: 180 },
];

// Quick navigation tiles
const navTiles = computed(() => [
  { label: '节点', count: overview.value?.totalNodes || 0, icon: '🖥', color: '#1890ff', path: '/K8S/node/list' },
  { label: '命名空间', count: overview.value?.namespaceCount || 0, icon: '📁', color: '#722ed1', path: '/K8S/namespace/list' },
  { label: '工作负载', count: (overview.value?.deploymentCount || 0) + (overview.value?.statefulSetCount || 0) + (overview.value?.daemonSetCount || 0), icon: '⚙', color: '#13c2c2', path: `/K8S/workload/list?clusterId=${clusterId}` },
  { label: 'Pod', count: overview.value?.totalPods || 0, icon: '📦', color: '#52c41a', path: `/K8S/pod/list?clusterId=${clusterId}` },
  { label: '服务', count: overview.value?.serviceCount || 0, icon: '🔗', color: '#fa8c16', path: `/K8S/service/list?clusterId=${clusterId}` },
  { label: '监控', count: null, icon: '📊', color: '#eb2f96', path: '/K8S/monitoring/cluster-status' },
]);

async function fetchData() {
  loading.value = true;
  try {
    const [overviewRes, componentsRes, eventsRes, rankingRes] = await Promise.all([
      getClusterOverview(clusterId),
      getClusterComponents(clusterId),
      getClusterEvents(clusterId, 20),
      getNodeRanking(clusterId, rankingSortBy.value, 5),
    ]);
    overview.value = overviewRes as any;
    components.value = Array.isArray(componentsRes) ? componentsRes : [];
    events.value = Array.isArray(eventsRes) ? eventsRes : [];
    nodeRanking.value = Array.isArray(rankingRes) ? rankingRes : [];
  } catch (e: any) {
    message.error('获取集群信息失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function changeRankingSort(value: string) {
  rankingSortBy.value = value;
  try {
    const res = await getNodeRanking(clusterId, value, 5);
    nodeRanking.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

function goBack() { router.push('/K8S/cluster/list'); }
function navigate(path: string) { router.push(path); }

// ====== SSH Config Modal ======
const sshModalVisible = ref(false);
const sshSaving = ref(false);
const sshForm = ref({
  sshHost: '',
  sshPort: 22,
  sshUser: 'root',
  sshPassword: '',
  sshKey: '',
});

async function openSshModal() {
  try {
    const cluster = await getCluster(clusterId) as any;
    sshForm.value = {
      sshHost: cluster.sshHost || '',
      sshPort: cluster.sshPort || 22,
      sshUser: cluster.sshUser || 'root',
      sshPassword: cluster.sshPassword || '',
      sshKey: cluster.sshKey || '',
    };
  } catch {
    // use defaults
  }
  sshModalVisible.value = true;
}

async function saveSsh() {
  if (!sshForm.value.sshHost.trim()) {
    message.warning('请输入SSH主机地址');
    return;
  }
  if (!sshForm.value.sshUser.trim()) {
    message.warning('请输入SSH用户名');
    return;
  }
  if (!sshForm.value.sshPassword && !sshForm.value.sshKey) {
    message.warning('请输入SSH密码或私钥');
    return;
  }
  sshSaving.value = true;
  try {
    await updateClusterSsh(clusterId, {
      sshHost: sshForm.value.sshHost,
      sshPort: sshForm.value.sshPort,
      sshUser: sshForm.value.sshUser,
      sshPassword: sshForm.value.sshPassword || undefined,
      sshKey: sshForm.value.sshKey || undefined,
    });
    message.success('SSH配置保存成功');
    sshModalVisible.value = false;
  } catch (e: any) {
    message.error('保存失败: ' + e.message);
  } finally {
    sshSaving.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- Header Bar -->
      <Card class="mb-4">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="margin: 0; font-size: 22px;">
              {{ overview?.cluster?.name || '加载中...' }}
              <Tag v-if="overview?.cluster?.status" :color="overview?.cluster?.status === 'active' ? 'green' : 'red'" style="margin-left: 8px; vertical-align: middle;">
                {{ overview?.cluster?.status === 'active' ? '运行中' : overview?.cluster?.status }}
              </Tag>
            </h2>
            <div style="color: #8c8c8c; margin-top: 4px;">
              {{ overview?.cluster?.description || '' }}
              <span v-if="overview?.k8sVersion" style="margin-left: 12px;">
                <Tag color="blue">K8s {{ overview.k8sVersion }}</Tag>
              </span>
            </div>
          </div>
          <Space>
            <Button @click="openSshModal">配置SSH</Button>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <!-- Quick Navigation Tiles -->
      <Row :gutter="12" class="mb-4">
        <Col :span="4" v-for="tile in navTiles" :key="tile.label">
          <Card size="small" hoverable class="nav-tile" @click="navigate(tile.path)">
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 4px;">{{ tile.icon }}</div>
              <div v-if="tile.count !== null" style="font-size: 22px; font-weight: bold;" :style="{ color: tile.color }">{{ tile.count }}</div>
              <div style="font-size: 13px; color: #595959;">{{ tile.label }}</div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- Cluster Status + Components -->
      <Row :gutter="16" class="mb-4">
        <!-- Node Online Ring -->
        <Col :span="8">
          <Card title="节点状态" style="height: 100%;">
            <div style="display: flex; align-items: center; gap: 24px;">
              <div style="text-align: center;">
                <Progress
                  type="circle"
                  :percent="overview?.totalNodes ? Math.round(((overview?.readyNodes || 0) / overview.totalNodes) * 100) : 0"
                  :width="100"
                  :stroke-color="'#36cfc9'"
                >
                  <template #format>
                    <div style="font-size: 20px; font-weight: bold;">
                      {{ overview?.readyNodes || 0 }}/{{ overview?.totalNodes || 0 }}
                    </div>
                  </template>
                </Progress>
                <div style="margin-top: 8px; color: #595959;">节点在线</div>
              </div>
              <div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #8c8c8c;">在线: </span>
                  <span style="font-weight: bold; color: #52c41a;">{{ overview?.readyNodes || 0 }}</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #8c8c8c;">全部: </span>
                  <span style="font-weight: bold;">{{ overview?.totalNodes || 0 }}</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #8c8c8c;">Pods: </span>
                  <span style="font-weight: bold;">{{ overview?.runningPods || 0 }} / {{ overview?.totalPods || 0 }}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <!-- Component Health Grid -->
        <Col :span="16">
          <Card style="height: 100%;">
            <template #title>
              <Space>
                <span>组件健康</span>
                <Badge :status="healthyComponents === totalComponents && totalComponents > 0 ? 'success' : 'warning'" />
                <span style="font-size: 13px; color: #8c8c8c;">{{ healthyComponents }}/{{ totalComponents }} 健康</span>
              </Space>
            </template>
            <Row :gutter="[12, 12]">
              <Col :span="8" v-for="comp in components" :key="comp.componentName">
                <div class="component-card" :class="{ 'component-healthy': comp.status === 'healthy', 'component-unhealthy': comp.status !== 'healthy' }">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500;">{{ comp.componentName }}</span>
                    <Badge :status="comp.status === 'healthy' ? 'success' : 'error'" :text="comp.status === 'healthy' ? '健康' : '异常'" />
                  </div>
                  <div v-if="comp.message" style="font-size: 12px; color: #8c8c8c; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ comp.message }}
                  </div>
                </div>
              </Col>
              <Col :span="24" v-if="components.length === 0">
                <div style="color: #8c8c8c; text-align: center; padding: 20px;">暂无组件信息</div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <!-- Resource Usage Gauges -->
      <Card title="资源使用" class="mb-4">
        <Row :gutter="16" justify="space-around">
          <Col :span="6" style="text-align: center;">
            <Progress type="circle" :percent="cpuPercent" :width="100" :stroke-color="cpuPercent > 80 ? '#ff4d4f' : '#1890ff'" />
            <div style="margin-top: 8px;">
              <div style="font-size: 16px; font-weight: bold;">
                {{ formatCpu(overview?.cpuUsed || 0) }} / {{ formatCpu(overview?.cpuCapacity || 0) }}
              </div>
              <div style="color: #8c8c8c;">CPU (核)</div>
            </div>
          </Col>
          <Col :span="6" style="text-align: center;">
            <Progress type="circle" :percent="memoryPercent" :width="100" :stroke-color="memoryPercent > 80 ? '#ff4d4f' : '#722ed1'" />
            <div style="margin-top: 8px;">
              <div style="font-size: 16px; font-weight: bold;">
                {{ formatBytes(overview?.memoryUsed || 0) }}
              </div>
              <div style="color: #8c8c8c;">内存 / {{ formatBytes(overview?.memoryCapacity || 0) }}</div>
            </div>
          </Col>
          <Col :span="6" style="text-align: center;">
            <Progress type="circle" :percent="podPercent" :width="100" stroke-color="#52c41a" />
            <div style="margin-top: 8px;">
              <div style="font-size: 16px; font-weight: bold;">
                {{ overview?.podUsed || 0 }} / {{ overview?.podCapacity || 0 }}
              </div>
              <div style="color: #8c8c8c;">Pod</div>
            </div>
          </Col>
          <Col :span="6" style="text-align: center;">
            <Progress type="circle" :percent="storagePercent" :width="100" :stroke-color="storagePercent > 80 ? '#ff4d4f' : '#faad14'" />
            <div style="margin-top: 8px;">
              <div style="font-size: 16px; font-weight: bold;">
                {{ formatBytes(overview?.storageUsed || 0) }}
              </div>
              <div style="color: #8c8c8c;">存储 / {{ formatBytes(overview?.storageCapacity || 0) }}</div>
            </div>
          </Col>
        </Row>
      </Card>

      <!-- Cluster Info -->
      <Card size="small" title="集群信息" class="mb-4">
        <Descriptions bordered :column="3" size="small">
          <DescriptionsItem label="集群名称">{{ overview?.cluster?.name || '-' }}</DescriptionsItem>
          <DescriptionsItem label="K8s版本">{{ overview?.k8sVersion || '-' }}</DescriptionsItem>
          <DescriptionsItem label="API Server">{{ overview?.cluster?.apiServerUrl || '-' }}</DescriptionsItem>
          <DescriptionsItem label="提供商">{{ overview?.cluster?.provider || '-' }}</DescriptionsItem>
          <DescriptionsItem label="网络插件">{{ overview?.cluster?.networkPlugin || '-' }}</DescriptionsItem>
          <DescriptionsItem label="容器运行时">{{ overview?.cluster?.containerRuntime || '-' }}</DescriptionsItem>
          <DescriptionsItem label="创建时间">{{ overview?.cluster?.createdAt || '-' }}</DescriptionsItem>
          <DescriptionsItem label="Deployment">{{ overview?.deploymentCount || 0 }}</DescriptionsItem>
          <DescriptionsItem label="StatefulSet / DaemonSet">{{ overview?.statefulSetCount || 0 }} / {{ overview?.daemonSetCount || 0 }}</DescriptionsItem>
        </Descriptions>
      </Card>

      <!-- Node Ranking Top 5 -->
      <Card class="mb-4">
        <template #title>
          <Space>
            <span>节点使用排名 Top 5</span>
            <Button size="small" @click="navigate('/K8S/node/list')">查看全部</Button>
          </Space>
        </template>
        <template #extra>
          <Select :value="rankingSortBy" size="small" style="width: 120px;" @change="changeRankingSort">
            <SelectOption value="cpu">按CPU排序</SelectOption>
            <SelectOption value="memory">按内存排序</SelectOption>
            <SelectOption value="pod">按Pod排序</SelectOption>
          </Select>
        </template>
        <Table :columns="rankingColumns" :data-source="nodeRanking" :pagination="false" row-key="name" size="small">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'rank'">
              <Tag :color="index === 0 ? 'red' : index === 1 ? 'orange' : index === 2 ? 'gold' : 'default'" style="min-width: 24px; text-align: center;">
                {{ index + 1 }}
              </Tag>
            </template>
            <template v-if="column.key === 'name'">
              <div>
                <a @click="navigate(`/K8S/node/detail/${clusterId}/${record.name}`)">{{ record.name }}</a>
                <div style="color: #8c8c8c; font-size: 12px;">{{ record.ip }}</div>
              </div>
            </template>
            <template v-if="column.key === 'cpu'">
              <div style="display: flex; align-items: center; gap: 8px;">
                <Progress :percent="record.cpuPercent" :show-info="false" size="small" style="width: 70px;"
                  :stroke-color="record.cpuPercent > 80 ? '#ff4d4f' : '#1890ff'" />
                <span style="font-size: 12px;">{{ record.cpuPercent }}%</span>
              </div>
            </template>
            <template v-if="column.key === 'memory'">
              <div style="display: flex; align-items: center; gap: 8px;">
                <Progress :percent="record.memoryPercent" :show-info="false" size="small" style="width: 70px;"
                  :stroke-color="record.memoryPercent > 80 ? '#ff4d4f' : '#722ed1'" />
                <span style="font-size: 12px;">{{ record.memoryPercent }}%</span>
              </div>
            </template>
            <template v-if="column.key === 'pod'">
              <div style="display: flex; align-items: center; gap: 8px;">
                <Progress :percent="record.podPercent" :show-info="false" size="small" style="width: 70px;" stroke-color="#52c41a" />
                <span style="font-size: 12px;">{{ record.podPercent }}%</span>
              </div>
            </template>
          </template>
        </Table>
      </Card>

      <!-- Cluster Events -->
      <Card title="集群事件">
        <Table :columns="eventColumns" :data-source="events" :pagination="{ pageSize: 10 }" :row-key="(_, i) => i" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <Tag :color="record.type === 'Warning' ? 'orange' : 'blue'">{{ record.type }}</Tag>
            </template>
            <template v-if="column.key === 'resource'">
              <span>{{ record.kind }}/{{ record.name }}</span>
              <div v-if="record.namespace" style="color: #8c8c8c; font-size: 12px;">{{ record.namespace }}</div>
            </template>
          </template>
        </Table>
      </Card>

      <!-- SSH Config Modal -->
      <Modal
        v-model:open="sshModalVisible"
        title="配置 SSH 连接"
        :confirm-loading="sshSaving"
        @ok="saveSsh"
        ok-text="保存"
        cancel-text="取消"
        :width="520"
      >
        <div style="margin-bottom:12px;color:#8c8c8c;font-size:13px">
          SSH 连接用于在集群 Master 节点上执行 Helm 等命令，配置后即可使用应用商店一键部署功能。
        </div>
        <Form layout="vertical" :model="sshForm">
          <FormItem label="SSH 主机地址" required>
            <Input v-model:value="sshForm.sshHost" placeholder="集群Master节点IP，如 192.168.1.100" />
          </FormItem>
          <FormItem label="SSH 端口">
            <InputNumber v-model:value="sshForm.sshPort" :min="1" :max="65535" style="width:120px" />
          </FormItem>
          <FormItem label="SSH 用户名" required>
            <Input v-model:value="sshForm.sshUser" placeholder="如 root" />
          </FormItem>
          <FormItem label="SSH 密码">
            <Input.Password v-model:value="sshForm.sshPassword" placeholder="与私钥二选一" />
          </FormItem>
          <FormItem label="SSH 私钥">
            <Textarea v-model:value="sshForm.sshKey" placeholder="PEM格式私钥（与密码二选一）" :rows="3" style="font-family:monospace;font-size:12px" />
          </FormItem>
        </Form>
      </Modal>
    </Spin>
  </div>
</template>

<style scoped>
.nav-tile {
  cursor: pointer;
  transition: all 0.2s;
}
.nav-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.component-card {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
.component-healthy {
  background: #f6ffed;
  border-color: #b7eb8f;
}
.component-unhealthy {
  background: #fff2f0;
  border-color: #ffccc7;
}
</style>
