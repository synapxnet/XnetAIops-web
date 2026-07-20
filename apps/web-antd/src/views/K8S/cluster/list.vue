<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Radio,
  RadioGroup,
  RadioButton,
  Input,
} from 'ant-design-vue';
import { getClusters, deleteCluster } from '../api/cluster';
import type { K8sCluster } from '../api/types';

const router = useRouter();
const loading = ref(false);
const clusters = ref<K8sCluster[]>([]);
const viewMode = ref<'card' | 'table'>('card');
const searchText = ref('');

const columns = [
  { title: '集群名称', dataIndex: 'name', key: 'name' },
  { title: 'API Server', dataIndex: 'apiServerUrl', key: 'apiServerUrl', ellipsis: true },
  { title: 'K8s版本', dataIndex: 'version', key: 'version', width: 120 },
  { title: '节点数', dataIndex: 'nodeCount', key: 'nodeCount', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '提供商', dataIndex: 'provider', key: 'provider', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  active: 'green', inactive: 'default', connecting: 'blue', error: 'red',
};
const statusLabelMap: Record<string, string> = {
  active: '运行中', inactive: '未连接', connecting: '连接中', error: '异常',
};

const filteredClusters = computed(() => {
  if (!searchText.value) return clusters.value;
  const kw = searchText.value.toLowerCase();
  return clusters.value.filter(c =>
    c.name.toLowerCase().includes(kw) || (c.provider || '').toLowerCase().includes(kw),
  );
});

const totalClusters = computed(() => clusters.value.length);
const activeClusters = computed(() => clusters.value.filter(c => c.status === 'active').length);
const totalNodes = computed(() => clusters.value.reduce((sum, c) => sum + (c.nodeCount || 0), 0));

async function fetchClusters() {
  loading.value = true;
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取集群列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goCreate() { router.push('/K8S/cluster/create'); }
function goDetail(record: K8sCluster) { router.push(`/K8S/cluster/detail/${record.id}`); }

function handleDelete(record: K8sCluster) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除集群「${record.name}」吗？该操作不可恢复。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteCluster(record.id);
        message.success('删除成功');
        fetchClusters();
      } catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <!-- Stats Banner -->
    <Row :gutter="16" class="mb-4">
      <Col :span="8">
        <Card>
          <Statistic title="集群总数" :value="totalClusters" :value-style="{ color: '#1890ff' }" />
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic title="运行中集群" :value="activeClusters" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic title="总节点数" :value="totalNodes" :value-style="{ color: '#722ed1' }" />
        </Card>
      </Col>
    </Row>

    <!-- Toolbar -->
    <Card>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <Space>
          <Input.Search v-model:value="searchText" placeholder="搜索集群名称/提供商" style="width: 260px;" allow-clear />
        </Space>
        <Space>
          <RadioGroup v-model:value="viewMode" size="small">
            <RadioButton value="card">卡片</RadioButton>
            <RadioButton value="table">表格</RadioButton>
          </RadioGroup>
          <Button @click="fetchClusters">刷新</Button>
          <Button type="primary" @click="goCreate">添加集群</Button>
        </Space>
      </div>

      <!-- Card View -->
      <template v-if="viewMode === 'card'">
        <Row :gutter="[16, 16]">
          <Col :span="8" v-for="cluster in filteredClusters" :key="cluster.id">
            <Card hoverable class="cluster-card" @click="goDetail(cluster)">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 16px; font-weight: 600;">{{ cluster.name }}</div>
                  <div style="color: #8c8c8c; font-size: 12px; margin-top: 2px;">{{ cluster.description || '暂无描述' }}</div>
                </div>
                <Tag :color="statusColorMap[cluster.status] || 'default'">
                  {{ statusLabelMap[cluster.status] || cluster.status }}
                </Tag>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div class="card-metric">
                  <div class="card-metric-label">K8s版本</div>
                  <div class="card-metric-value">{{ cluster.version || '-' }}</div>
                </div>
                <div class="card-metric">
                  <div class="card-metric-label">节点数</div>
                  <div class="card-metric-value">{{ cluster.nodeCount || 0 }}</div>
                </div>
                <div class="card-metric">
                  <div class="card-metric-label">提供商</div>
                  <div class="card-metric-value">{{ cluster.provider || '-' }}</div>
                </div>
                <div class="card-metric">
                  <div class="card-metric-label">网络插件</div>
                  <div class="card-metric-value">{{ cluster.networkPlugin || '-' }}</div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f0f0; padding-top: 8px;">
                <span style="font-size: 12px; color: #8c8c8c;">{{ cluster.createdAt }}</span>
                <Space>
                  <Button type="link" size="small" @click.stop="goDetail(cluster)">详情</Button>
                  <Button type="link" size="small" danger @click.stop="handleDelete(cluster)">删除</Button>
                </Space>
              </div>
            </Card>
          </Col>

          <!-- Empty State -->
          <Col :span="24" v-if="filteredClusters.length === 0 && !loading">
            <div style="text-align: center; padding: 60px 0; color: #8c8c8c;">
              <div style="font-size: 48px; margin-bottom: 16px;">⎈</div>
              <div style="font-size: 16px;">暂无集群</div>
              <Button type="primary" style="margin-top: 16px;" @click="goCreate">添加集群</Button>
            </div>
          </Col>
        </Row>
      </template>

      <!-- Table View -->
      <template v-else>
        <Table :columns="columns" :data-source="filteredClusters" :loading="loading" row-key="id" :scroll="{ x: 1200 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a @click="goDetail(record)">{{ record.name }}</a>
            </template>
            <template v-if="column.key === 'status'">
              <Tag :color="statusColorMap[record.status] || 'default'">
                {{ statusLabelMap[record.status] || record.status }}
              </Tag>
            </template>
            <template v-if="column.key === 'action'">
              <Space>
                <Button type="link" size="small" @click="goDetail(record)">详情</Button>
                <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
              </Space>
            </template>
          </template>
        </Table>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.cluster-card {
  cursor: pointer;
  transition: all 0.2s;
}
.cluster-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.card-metric {
  padding: 4px 0;
}
.card-metric-label {
  font-size: 12px;
  color: #8c8c8c;
}
.card-metric-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}
</style>
