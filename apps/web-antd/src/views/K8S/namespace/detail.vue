<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Row,
  Col,
  Tag,
  Table,
  Tabs,
  TabPane,
  Button,
  Space,
  Spin,
  Progress,
  message,
} from 'ant-design-vue';
import { getNamespace, getNamespaceOverview, getNamespaceEvents, getResourceQuotas } from '../api/namespace';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const namespaceName = route.params.namespace as string;

const loading = ref(true);
const nsInfo = ref<any>(null);
const overview = ref<any>(null);
const events = ref<any[]>([]);
const quotas = ref<any[]>([]);
const activeTab = ref('overview');

const eventColumns = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '资源', key: 'resource', width: 200 },
  { title: '原因', dataIndex: 'reason', key: 'reason', width: 140 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '次数', dataIndex: 'count', key: 'count', width: 60 },
  { title: '时间', dataIndex: 'lastTimestamp', key: 'lastTimestamp', width: 180 },
];

// Resource type tiles for KubeSphere project overview style
const resourceTiles = computed(() => [
  { label: 'Pod', count: overview.value?.podCount || 0, running: overview.value?.runningPods, color: '#1890ff', icon: '📦', path: `/K8S/pod/list?clusterId=${clusterId}&namespace=${namespaceName}` },
  { label: 'Deployment', count: overview.value?.deploymentCount || 0, color: '#722ed1', icon: '⚙', path: `/K8S/workload/list?clusterId=${clusterId}&namespace=${namespaceName}` },
  { label: 'StatefulSet', count: overview.value?.statefulSetCount || 0, color: '#13c2c2', icon: '🗄', path: `/K8S/workload/list?clusterId=${clusterId}&namespace=${namespaceName}&tab=statefulsets` },
  { label: 'DaemonSet', count: overview.value?.daemonSetCount || 0, color: '#fa8c16', icon: '🔄', path: `/K8S/workload/list?clusterId=${clusterId}&namespace=${namespaceName}&tab=daemonsets` },
  { label: 'Service', count: overview.value?.serviceCount || 0, color: '#52c41a', icon: '🔗', path: `/K8S/service/list?clusterId=${clusterId}&namespace=${namespaceName}` },
  { label: 'Job', count: overview.value?.jobCount || 0, color: '#eb2f96', icon: '⏱', path: `/K8S/job/list?clusterId=${clusterId}&namespace=${namespaceName}` },
  { label: 'CronJob', count: overview.value?.cronJobCount || 0, color: '#faad14', icon: '🕐', path: `/K8S/job/list?clusterId=${clusterId}&namespace=${namespaceName}&tab=cronjobs` },
  { label: 'ConfigMap', count: overview.value?.configMapCount || 0, color: '#2f54eb', icon: '📋', path: `/K8S/config/configmap-list?clusterId=${clusterId}&namespace=${namespaceName}` },
  { label: 'Secret', count: overview.value?.secretCount || 0, color: '#595959', icon: '🔒', path: `/K8S/config/secret-list?clusterId=${clusterId}&namespace=${namespaceName}` },
  { label: 'Ingress', count: overview.value?.ingressCount || 0, color: '#36cfc9', icon: '🌐', path: `/K8S/ingress/list?clusterId=${clusterId}&namespace=${namespaceName}` },
]);

// Quota usage bars
const quotaUsage = computed(() => {
  if (quotas.value.length === 0) return [];
  const items: any[] = [];
  for (const q of quotas.value) {
    for (const [resource, hardVal] of Object.entries(q.hard || {})) {
      const usedVal = q.used?.[resource] || '0';
      const hard = parseResourceValue(hardVal as string);
      const used = parseResourceValue(usedVal as string);
      const pct = hard > 0 ? Math.round((used / hard) * 100) : 0;
      items.push({ resource, hard: hardVal, used: usedVal, percent: pct, quotaName: q.name });
    }
  }
  return items;
});

function parseResourceValue(val: string): number {
  if (!val) return 0;
  const num = parseFloat(val);
  if (val.endsWith('Ki')) return num * 1024;
  if (val.endsWith('Mi')) return num * 1024 * 1024;
  if (val.endsWith('Gi')) return num * 1024 * 1024 * 1024;
  if (val.endsWith('m')) return num / 1000;
  return isNaN(num) ? 0 : num;
}

async function fetchData() {
  loading.value = true;
  try {
    const [nsRes, overviewRes, eventsRes, quotasRes] = await Promise.all([
      getNamespace(clusterId, namespaceName),
      getNamespaceOverview(clusterId, namespaceName),
      getNamespaceEvents(clusterId, namespaceName, 30),
      getResourceQuotas(clusterId, namespaceName),
    ]);
    nsInfo.value = nsRes;
    overview.value = overviewRes;
    events.value = Array.isArray(eventsRes) ? eventsRes : [];
    quotas.value = Array.isArray(quotasRes) ? quotasRes : [];
  } catch (e: any) {
    message.error('获取命名空间信息失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goBack() { router.push('/K8S/namespace/list'); }
function navigate(path: string) { router.push(path); }

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- Header -->
      <Card class="mb-4">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0;">
              {{ namespaceName }}
              <Tag v-if="nsInfo?.status" :color="nsInfo.status === 'Active' ? 'green' : 'red'" style="margin-left: 8px; vertical-align: middle;">
                {{ nsInfo.status }}
              </Tag>
            </h2>
            <div style="color: #8c8c8c; margin-top: 4px; font-size: 13px;">
              集群 #{{ clusterId }}
            </div>
          </div>
          <Space>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <!-- Overview Tab -->
        <TabPane key="overview" tab="概览">
          <!-- Resource Tiles Grid (KubeSphere Project Style) -->
          <Row :gutter="[12, 12]" class="mb-4">
            <Col :span="4" v-for="tile in resourceTiles" :key="tile.label" :span-lg="4" :span-md="6" :span-sm="8">
              <Card size="small" hoverable class="resource-tile" @click="navigate(tile.path)">
                <div style="text-align: center;">
                  <div style="font-size: 20px;">{{ tile.icon }}</div>
                  <div style="font-size: 22px; font-weight: bold; margin: 4px 0;" :style="{ color: tile.color }">
                    {{ tile.count }}
                  </div>
                  <div class="text-muted-foreground text-xs">{{ tile.label }}</div>
                  <div v-if="tile.running !== undefined" style="font-size: 11px; color: #52c41a;">
                    运行中: {{ tile.running }}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <!-- Resource Quota Usage Bars -->
          <Card v-if="quotaUsage.length > 0" title="资源配额使用" class="mb-4">
            <div v-for="(item, idx) in quotaUsage" :key="idx" style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: 500;">{{ item.resource }}</span>
                <span style="font-size: 12px; color: #8c8c8c;">{{ item.used }} / {{ item.hard }}</span>
              </div>
              <Progress
                :percent="item.percent"
                :stroke-color="item.percent > 80 ? '#ff4d4f' : item.percent > 60 ? '#faad14' : '#52c41a'"
                :show-info="true"
                size="small"
              />
            </div>
          </Card>

          <!-- Quick Actions -->
          <Card title="快捷操作" class="mb-4">
            <Space wrap>
              <Button type="primary" @click="navigate(`/K8S/workload/list?clusterId=${clusterId}&namespace=${namespaceName}`)">查看工作负载</Button>
              <Button @click="navigate(`/K8S/pod/list?clusterId=${clusterId}&namespace=${namespaceName}`)">查看Pod</Button>
              <Button @click="navigate(`/K8S/service/list?clusterId=${clusterId}&namespace=${namespaceName}`)">查看服务</Button>
              <Button @click="navigate(`/K8S/config/configmap-list?clusterId=${clusterId}&namespace=${namespaceName}`)">查看配置</Button>
            </Space>
          </Card>
        </TabPane>

        <!-- Events Tab -->
        <TabPane key="events" tab="事件">
          <Card>
            <Table :columns="eventColumns" :data-source="events" :pagination="{ pageSize: 15 }" :row-key="(_, i) => i" size="small">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag :color="record.type === 'Warning' ? 'orange' : 'blue'">{{ record.type }}</Tag>
                </template>
                <template v-if="column.key === 'resource'">
                  <span>{{ record.kind }}/{{ record.name }}</span>
                </template>
              </template>
            </Table>
          </Card>
        </TabPane>

        <!-- Labels Tab -->
        <TabPane key="labels" tab="标签与注解">
          <Card title="标签 (Labels)" class="mb-4">
            <div v-if="nsInfo?.labels && Object.keys(nsInfo.labels).length > 0" style="display: flex; flex-wrap: wrap; gap: 6px;">
              <Tag v-for="(value, key) in nsInfo.labels" :key="key" color="blue">{{ key }}={{ value }}</Tag>
            </div>
            <div v-else style="color: #8c8c8c;">无标签</div>
          </Card>
          <Card title="注解 (Annotations)">
            <div v-if="nsInfo?.annotations && Object.keys(nsInfo.annotations).length > 0" style="display: flex; flex-wrap: wrap; gap: 6px;">
              <Tag v-for="(value, key) in nsInfo.annotations" :key="key" color="default">{{ key }}={{ value }}</Tag>
            </div>
            <div v-else style="color: #8c8c8c;">无注解</div>
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>

<style scoped>
.resource-tile {
  cursor: pointer;
  transition: all 0.2s;
}
.resource-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
