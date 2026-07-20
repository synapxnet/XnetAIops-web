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
  Badge,
  Spin,
  message,
} from 'ant-design-vue';
import { getNode, getNodePods } from '../api/node';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const nodeName = route.params.nodeName as string;

const loading = ref(true);
const nodeInfo = ref<any>(null);
const pods = ref<any[]>([]);
const activeTab = ref('info');

const podColumns = [
  { title: 'Pod名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '就绪', dataIndex: 'ready', key: 'ready', width: 80 },
  { title: '重启次数', dataIndex: 'restarts', key: 'restarts', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100 },
];

async function fetchData() {
  loading.value = true;
  try {
    const [nodeRes, podsRes] = await Promise.all([
      getNode(clusterId, nodeName),
      getNodePods(clusterId, nodeName),
    ]);
    nodeInfo.value = nodeRes;
    pods.value = Array.isArray(podsRes) ? podsRes : [];
  } catch (e: any) {
    message.error('获取节点信息失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/K8S/node/list');
}

function goMonitoring() {
  router.push(`/K8S/monitoring/node-detail/${clusterId}/${nodeName}`);
}

function goPodDetail(record: any) {
  router.push(`/K8S/pod/detail/${clusterId}/${record.namespace}/${record.name}`);
}

function formatMemory(memStr: string | undefined): string {
  if (!memStr) return '-';
  const num = Number.parseInt(memStr, 10);
  if (Number.isNaN(num)) return memStr;
  return (num / 1024 / 1024).toFixed(1) + ' GiB';
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
            <h2 style="margin: 0;">{{ nodeName }}</h2>
            <Space class="mt-1">
              <Tag v-if="nodeInfo?.status" :color="nodeInfo.status === 'Ready' ? 'green' : 'red'">
                {{ nodeInfo.status }}
              </Tag>
              <Tag v-for="role in (nodeInfo?.roles || [])" :key="role" color="blue">{{ role }}</Tag>
              <Tag v-if="nodeInfo?.unschedulable" color="orange">不可调度</Tag>
            </Space>
          </div>
          <Space>
            <Button @click="goMonitoring">监控</Button>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <!-- 基本信息 -->
        <TabPane key="info" tab="基本信息">
          <Card title="节点属性" class="mb-4">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="节点名称">{{ nodeInfo?.name }}</DescriptionsItem>
              <DescriptionsItem label="内部IP">{{ nodeInfo?.internalIP || '-' }}</DescriptionsItem>
              <DescriptionsItem label="主机名">{{ nodeInfo?.hostname || '-' }}</DescriptionsItem>
              <DescriptionsItem label="操作系统">{{ nodeInfo?.systemInfo?.osImage || nodeInfo?.osImage || '-' }}</DescriptionsItem>
              <DescriptionsItem label="内核版本">{{ nodeInfo?.systemInfo?.kernelVersion || nodeInfo?.kernelVersion || '-' }}</DescriptionsItem>
              <DescriptionsItem label="容器运行时">{{ nodeInfo?.systemInfo?.containerRuntimeVersion || nodeInfo?.containerRuntime || '-' }}</DescriptionsItem>
              <DescriptionsItem label="Kubelet版本">{{ nodeInfo?.systemInfo?.kubeletVersion || nodeInfo?.kubeletVersion || '-' }}</DescriptionsItem>
              <DescriptionsItem label="架构">{{ nodeInfo?.systemInfo?.architecture || nodeInfo?.architecture || '-' }}</DescriptionsItem>
              <DescriptionsItem label="CPU容量">{{ nodeInfo?.cpuCapacity || '-' }} 核</DescriptionsItem>
              <DescriptionsItem label="内存容量">{{ formatMemory(nodeInfo?.memoryCapacity) }}</DescriptionsItem>
              <DescriptionsItem label="Pod容量">{{ nodeInfo?.podCapacity || '-' }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ nodeInfo?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>

          <!-- 节点状况 -->
          <Card v-if="nodeInfo?.conditions" title="节点状况" class="mb-4">
            <Table
              :data-source="nodeInfo.conditions"
              :pagination="false"
              row-key="type"
              size="small"
            >
              <template #default>
                <Table.Column title="类型" dataIndex="type" />
                <Table.Column title="状态" dataIndex="status">
                  <template #default="{ record: cond }">
                    <Badge :status="cond.status === 'True' && cond.type === 'Ready' ? 'success' : cond.status === 'False' ? 'success' : 'error'" />
                    {{ cond.status }}
                  </template>
                </Table.Column>
                <Table.Column title="原因" dataIndex="reason" />
                <Table.Column title="消息" dataIndex="message" :ellipsis="true" />
              </template>
            </Table>
          </Card>

          <!-- 污点 -->
          <Card v-if="nodeInfo?.taints && nodeInfo.taints.length > 0" title="污点 (Taints)" class="mb-4">
            <div v-for="(taint, idx) in nodeInfo.taints" :key="idx" style="margin-bottom: 8px;">
              <Tag color="orange">
                {{ taint.key }}={{ taint.value || '' }}:{{ taint.effect }}
              </Tag>
            </div>
          </Card>

          <!-- 标签 -->
          <Card v-if="nodeInfo?.labels" title="标签 (Labels)">
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <Tag v-for="(value, key) in nodeInfo.labels" :key="key" color="blue">
                {{ key }}={{ value }}
              </Tag>
            </div>
          </Card>
        </TabPane>

        <!-- Pod列表 -->
        <TabPane key="pods" :tab="`Pod列表 (${pods.length})`">
          <Card>
            <Table
              :columns="podColumns"
              :data-source="pods"
              row-key="name"
              :pagination="{ pageSize: 20 }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a @click="goPodDetail(record)">{{ record.name }}</a>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="record.status === 'Running' ? 'green' : record.status === 'Succeeded' ? 'blue' : 'red'">
                    {{ record.status }}
                  </Tag>
                </template>
                <template v-if="column.key === 'action'">
                  <Button type="link" size="small" @click="goPodDetail(record)">详情</Button>
                </template>
              </template>
            </Table>
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
