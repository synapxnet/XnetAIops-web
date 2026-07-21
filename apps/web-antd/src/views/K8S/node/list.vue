<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  SelectOption,
  Progress,
  message,
  Modal,
} from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getNodes, cordonNode, uncordonNode } from '../api/node';
import type { K8sCluster, K8sNode } from '../api/types';
import { demoK8sNodes, isDemoK8sCluster } from '../demo-data';

const router = useRouter();
const loading = ref(false);
const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const nodes = ref<K8sNode[]>([]);
const isDemoSelection = computed(() =>
  isDemoK8sCluster(clusters.value, selectedClusterId.value),
);

const columns = [
  { title: '节点名称', dataIndex: 'name', key: 'name' },
  { title: 'IP地址', dataIndex: 'internalIP', key: 'internalIP', width: 140 },
  { title: '角色', dataIndex: 'roles', key: 'roles', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'CPU', key: 'cpu', width: 100 },
  { title: '内存', key: 'memory', width: 150 },
  { title: '容器运行时', dataIndex: 'containerRuntime', key: 'containerRuntime', width: 160 },
  { title: 'Kubelet版本', dataIndex: 'kubeletVersion', key: 'kubeletVersion', width: 130 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const activeClusters = clusters.value.filter((c) => c.status === 'active');
    if (activeClusters.length > 0 && !selectedClusterId.value) {
      selectedClusterId.value = activeClusters[0]!.id;
      fetchNodes();
    }
  } catch (e: any) {
    message.error('获取集群列表失败');
  }
}

async function fetchNodes() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  if (isDemoSelection.value) {
    nodes.value = demoK8sNodes;
    loading.value = false;
    return;
  }
  try {
    const res = await getNodes(selectedClusterId.value);
    const nodeList = Array.isArray(res) ? res : [];
    nodes.value = nodeList.length === 0 && isDemoSelection.value
      ? demoK8sNodes
      : nodeList;
  } catch (e: any) {
    message.error('获取节点列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleClusterChange(value: number) {
  selectedClusterId.value = value;
  fetchNodes();
}

function goDetail(record: K8sNode) {
  if (isDemoSelection.value) {
    message.info('演示集群资源为只读展示');
    return;
  }
  router.push(`/K8S/node/detail/${selectedClusterId.value}/${record.name}`);
}

function handleCordon(record: K8sNode) {
  if (isDemoSelection.value) {
    message.info('演示集群资源为只读展示');
    return;
  }
  const isCordon = !record.unschedulable;
  Modal.confirm({
    title: isCordon ? '标记不可调度' : '取消不可调度',
    content: `确定要${isCordon ? '标记' : '取消'}节点「${record.name}」${isCordon ? '不可调度' : '的不可调度状态'}吗？`,
    async onOk() {
      try {
        if (isCordon) {
          await cordonNode(selectedClusterId.value!, record.name);
        } else {
          await uncordonNode(selectedClusterId.value!, record.name);
        }
        message.success('操作成功');
        fetchNodes();
      } catch (e: any) {
        message.error('操作失败: ' + e.message);
      }
    },
  });
}

function formatMemory(memStr: string | undefined): string {
  if (!memStr) return '-';
  const num = Number.parseInt(memStr, 10);
  if (Number.isNaN(num)) return memStr;
  // Ki to GiB
  return (num / 1024 / 1024).toFixed(1) + ' GiB';
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="节点管理">
      <template #extra>
        <Space>
          <span style="color: #8c8c8c;">选择集群:</span>
          <Select
            :value="selectedClusterId"
            style="width: 200px;"
            placeholder="选择集群"
            @change="handleClusterChange"
          >
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">
              {{ c.name }}
              <Tag v-if="c.status === 'active'" color="green" size="small" class="ml-1">运行中</Tag>
            </SelectOption>
          </Select>
          <Button @click="fetchNodes">刷新</Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="nodes"
        :loading="loading"
        row-key="name"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="goDetail(record)">{{ record.name }}</a>
            <Tag v-if="record.unschedulable" color="orange" size="small" class="ml-1">不可调度</Tag>
          </template>
          <template v-if="column.key === 'roles'">
            <Tag v-for="role in record.roles" :key="role" color="blue" size="small">{{ role }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'Ready' ? 'green' : 'red'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'cpu'">
            {{ record.cpuCapacity || '-' }} 核
          </template>
          <template v-if="column.key === 'memory'">
            {{ formatMemory(record.memoryCapacity) }}
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="goDetail(record)">详情</Button>
              <Button type="link" size="small" @click="handleCordon(record)">
                {{ record.unschedulable ? '取消调度限制' : '设为不可调度' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
