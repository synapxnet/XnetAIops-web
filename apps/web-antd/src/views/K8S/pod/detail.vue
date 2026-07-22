<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Descriptions,
  DescriptionsItem,
  Tag,
  Table,
  Tabs,
  TabPane,
  Button,
  Space,
  Select,
  SelectOption,
  Spin,
  message,
} from 'ant-design-vue';
import { getPod, getPodLogs, getPodEvents, getPodContainers } from '../api/pod';
import YamlEditor from '../components/YamlEditor.vue';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const namespace = route.params.namespace as string;
const podName = route.params.podName as string;

const loading = ref(true);
const podInfo = ref<any>(null);
const containers = ref<any[]>([]);
const events = ref<any[]>([]);
const logs = ref('');
const selectedContainer = ref('');
const activeTab = ref('info');

const statusColorMap: Record<string, string> = {
  Running: 'green',
  Succeeded: 'blue',
  Pending: 'orange',
  Failed: 'red',
  Waiting: 'orange',
  Terminated: 'red',
};

const containerColumns = [
  { title: '容器名', dataIndex: 'name', key: 'name' },
  { title: '镜像', dataIndex: 'image', key: 'image', ellipsis: true },
  { title: '状态', key: 'state', width: 100 },
  { title: '就绪', key: 'ready', width: 60 },
  { title: '重启', dataIndex: 'restartCount', key: 'restartCount', width: 60 },
  { title: '端口', key: 'ports', width: 160 },
];

const eventColumns = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '原因', dataIndex: 'reason', key: 'reason', width: 140 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '次数', dataIndex: 'count', key: 'count', width: 60 },
  { title: '时间', dataIndex: 'lastTimestamp', key: 'lastTimestamp', width: 180 },
];

async function fetchData() {
  loading.value = true;
  try {
    const [podRes, containersRes, eventsRes] = await Promise.all([
      getPod(clusterId, namespace, podName),
      getPodContainers(clusterId, namespace, podName),
      getPodEvents(clusterId, namespace, podName),
    ]);
    podInfo.value = podRes;
    containers.value = Array.isArray(containersRes) ? containersRes : [];
    events.value = Array.isArray(eventsRes) ? eventsRes : [];

    // Auto-select first container for logs
    const mainContainers = containers.value.filter(c => !c.isInit);
    if (mainContainers.length > 0 && !selectedContainer.value) {
      selectedContainer.value = mainContainers[0].name;
    }
  } catch (e: any) {
    message.error('获取Pod信息失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function fetchLogs() {
  try {
    const res = await getPodLogs(clusterId, namespace, podName, selectedContainer.value, 500);
    logs.value = typeof res === 'string' ? res : String(res);
  } catch (e: any) {
    logs.value = '获取日志失败: ' + e.message;
  }
}

function handleContainerChange(value: string) {
  selectedContainer.value = value;
  fetchLogs();
}

function handleTabChange(key: string) {
  activeTab.value = key;
  if (key === 'logs' && !logs.value) {
    fetchLogs();
  }
}

function goBack() {
  router.push(`/K8S/pod/list?clusterId=${clusterId}&namespace=${namespace}`);
}

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- 顶部 -->
      <Card class="mb-4">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0;">{{ podName }}</h2>
            <Space class="mt-1">
              <Tag :color="statusColorMap[podInfo?.status] || 'default'">{{ podInfo?.status || '-' }}</Tag>
              <span style="color: #8c8c8c;">{{ namespace }}</span>
              <span v-if="podInfo?.nodeName" style="color: #8c8c8c;">节点: {{ podInfo.nodeName }}</span>
            </Space>
          </div>
          <Space>
            <Button @click="router.push(`/K8S/terminal/index?clusterId=${clusterId}&namespace=${namespace}&podName=${podName}`)">终端</Button>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- 基本信息 -->
        <TabPane key="info" tab="基本信息">
          <Card title="Pod属性" class="mb-4">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ podInfo?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ podInfo?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="statusColorMap[podInfo?.status] || 'default'">{{ podInfo?.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem label="就绪">{{ podInfo?.ready }}</DescriptionsItem>
              <DescriptionsItem label="重启次数">{{ podInfo?.restarts }}</DescriptionsItem>
              <DescriptionsItem label="Pod IP">{{ podInfo?.podIP || '-' }}</DescriptionsItem>
              <DescriptionsItem label="Host IP">{{ podInfo?.hostIP || '-' }}</DescriptionsItem>
              <DescriptionsItem label="节点"><a v-if="podInfo?.nodeName" @click="router.push(`/K8S/node/detail/${clusterId}/${podInfo.nodeName}`)">{{ podInfo.nodeName }}</a><span v-else>-</span></DescriptionsItem>
              <DescriptionsItem label="服务账户">{{ podInfo?.serviceAccount || '-' }}</DescriptionsItem>
              <DescriptionsItem label="重启策略">{{ podInfo?.restartPolicy || '-' }}</DescriptionsItem>
              <DescriptionsItem label="DNS策略">{{ podInfo?.dnsPolicy || '-' }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ podInfo?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>

          <!-- 所属工作负载 -->
          <Card v-if="podInfo?.ownerReferences?.length" title="所属工作负载" class="mb-4">
            <Space>
              <Tag v-for="owner in podInfo.ownerReferences" :key="owner.name" color="blue" style="cursor: pointer;"
                @click="router.push(`/K8S/workload/detail/${clusterId}/${namespace}/${owner.kind}/${owner.name}`)">
                {{ owner.kind }}/{{ owner.name }}
              </Tag>
            </Space>
          </Card>

          <!-- 条件 -->
          <Card v-if="podInfo?.conditions?.length" title="条件" class="mb-4">
            <Table
              :data-source="podInfo.conditions"
              :pagination="false"
              row-key="type"
              size="small"
            >
              <Table.Column title="类型" dataIndex="type" />
              <Table.Column title="状态" dataIndex="status">
                <template #default="{ record }">
                  <Tag :color="record.status === 'True' ? 'green' : 'red'">{{ record.status }}</Tag>
                </template>
              </Table.Column>
              <Table.Column title="原因" dataIndex="reason" />
              <Table.Column title="时间" dataIndex="lastTransitionTime" />
            </Table>
          </Card>
        </TabPane>

        <!-- 容器 -->
        <TabPane key="containers" :tab="`容器 (${containers.length})`">
          <Card>
            <Table
              :columns="containerColumns"
              :data-source="containers"
              :pagination="false"
              row-key="name"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'state'">
                  <Tag :color="statusColorMap[record.state] || 'default'">{{ record.state || '-' }}</Tag>
                </template>
                <template v-if="column.key === 'ready'">
                  <Tag :color="record.ready ? 'green' : 'red'">{{ record.ready ? '是' : '否' }}</Tag>
                </template>
                <template v-if="column.key === 'ports'">
                  <span v-if="record.ports && record.ports.length > 0">
                    <Tag v-for="(p, idx) in record.ports" :key="idx" size="small">
                      {{ p.containerPort }}/{{ p.protocol || 'TCP' }}
                    </Tag>
                  </span>
                  <span v-else>-</span>
                </template>
              </template>
            </Table>
          </Card>
        </TabPane>

        <!-- 日志 -->
        <TabPane key="logs" tab="日志">
          <Card>
            <div style="margin-bottom: 12px;">
              <Space>
                <span style="color: #8c8c8c;">容器:</span>
                <Select
                  :value="selectedContainer"
                  style="width: 200px;"
                  @change="handleContainerChange"
                >
                  <SelectOption v-for="c in containers.filter(c => !c.isInit)" :key="c.name" :value="c.name">
                    {{ c.name }}
                  </SelectOption>
                </Select>
                <Button @click="fetchLogs">刷新日志</Button>
              </Space>
            </div>
            <pre style="max-height: 500px; overflow: auto; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px; font-size: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-all;">{{ logs || '暂无日志' }}</pre>
          </Card>
        </TabPane>

        <!-- 事件 -->
        <TabPane key="events" :tab="`事件 (${events.length})`">
          <Card>
            <Table
              :columns="eventColumns"
              :data-source="events"
              :pagination="false"
              :row-key="(_, i) => i"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag :color="record.type === 'Warning' ? 'orange' : 'blue'">{{ record.type }}</Tag>
                </template>
              </template>
            </Table>
          </Card>
        </TabPane>

        <!-- Volumes -->
        <TabPane v-if="podInfo?.volumes?.length" key="volumes" :tab="`存储卷 (${podInfo?.volumes?.length || 0})`">
          <Card>
            <Table
              :data-source="podInfo.volumes"
              :pagination="false"
              row-key="name"
              size="small"
            >
              <Table.Column title="名称" dataIndex="name" />
              <Table.Column title="类型" dataIndex="type">
                <template #default="{ record }">
                  <Tag>{{ record.type }}</Tag>
                </template>
              </Table.Column>
              <Table.Column title="详情">
                <template #default="{ record }">
                  <span v-if="record.claimName">PVC: {{ record.claimName }}</span>
                  <span v-else-if="record.path">路径: {{ record.path }}</span>
                  <span v-else>-</span>
                </template>
              </Table.Column>
            </Table>
          </Card>
        </TabPane>

        <!-- YAML -->
        <TabPane key="yaml" tab="YAML">
          <Card>
            <YamlEditor :model-value="podInfo?.yaml || ''" :read-only="true" height="600px" />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
