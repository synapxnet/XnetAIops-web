<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Select, SelectOption, Space, Button, Tag, Tabs, TabPane, Progress, Spin, message } from 'ant-design-vue';
import { getNodeRanking, getNamespaceRanking } from '../api/monitoring';
import K8sSelector from '../components/K8sSelector.vue';

const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const activeTab = ref('namespace');

const nodeRanking = ref<any[]>([]);
const nsRanking = ref<any[]>([]);
const nodeMetric = ref('cpu');
const nsMetric = ref('cpu');

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const [nr, nsr] = await Promise.all([
      getNodeRanking(selectedClusterId.value, nodeMetric.value, 10),
      getNamespaceRanking(selectedClusterId.value, nsMetric.value, 10),
    ]);
    nodeRanking.value = Array.isArray(nr) ? nr : [];
    nsRanking.value = Array.isArray(nsr) ? nsr : [];
  } catch (e: any) {
    message.error('获取排名数据失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function formatValue(val: number | null, metric: string): string {
  if (val == null) return '-';
  if (metric === 'memory') return (val / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  if (metric === 'cpu') return (val * 100).toFixed(1) + '%';
  if (metric === 'load') return val.toFixed(2);
  if (metric === 'pod') return Math.round(val).toString();
  if (metric === 'disk') return (val * 100).toFixed(1) + '%';
  return val.toFixed(2);
}

function toPercent(val: number | null, metric: string): number {
  if (val == null) return 0;
  if (metric === 'cpu' || metric === 'memory' || metric === 'disk') {
    return Math.min(Math.round(val * 100), 100);
  }
  if (metric === 'load') return Math.min(Math.round(val * 10), 100);
  if (metric === 'pod') return Math.min(Math.round(val), 100);
  return Math.min(Math.round(val * 100), 100);
}

function getBarColor(pct: number): string {
  if (pct > 80) return '#ff4d4f';
  if (pct > 60) return '#faad14';
  return '#1890ff';
}
</script>

<template>
  <div class="p-4">
    <Card title="应用资源监控">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" :show-namespace="false" @change="fetchData" />
          <Button @click="fetchData" :loading="loading">刷新</Button>
        </Space>
      </template>

      <Spin :spinning="loading">
        <Tabs v-model:activeKey="activeTab">
          <TabPane key="namespace" tab="命名空间排名">
            <div style="display: flex; align-items: center; margin-bottom: 16px; gap: 12px;">
              <span class="text-muted-foreground">排序指标:</span>
              <Select v-model:value="nsMetric" size="small" style="width: 100px" @change="fetchData">
                <SelectOption value="cpu">CPU</SelectOption>
                <SelectOption value="memory">内存</SelectOption>
              </Select>
            </div>
            <div v-for="(item, idx) in nsRanking" :key="item.namespace || idx" class="ranking-item">
              <Tag :color="idx === 0 ? 'red' : idx === 1 ? 'orange' : idx === 2 ? 'gold' : 'default'" class="ranking-tag">{{ idx + 1 }}</Tag>
              <span class="ranking-name">{{ item.namespace || '-' }}</span>
              <div class="ranking-bar">
                <Progress
                  :percent="toPercent(item.value, nsMetric)"
                  :stroke-color="getBarColor(toPercent(item.value, nsMetric))"
                  :show-info="false"
                  size="small"
                />
              </div>
              <span class="ranking-value">{{ formatValue(item.value, nsMetric) }}</span>
            </div>
            <div v-if="nsRanking.length === 0 && !loading" style="text-align: center; color: #8c8c8c; padding: 40px;">
              暂无数据（请确认Prometheus已配置）
            </div>
          </TabPane>

          <TabPane key="node" tab="节点排名">
            <div style="display: flex; align-items: center; margin-bottom: 16px; gap: 12px;">
              <span class="text-muted-foreground">排序指标:</span>
              <Select v-model:value="nodeMetric" size="small" style="width: 100px" @change="fetchData">
                <SelectOption value="cpu">CPU</SelectOption>
                <SelectOption value="memory">内存</SelectOption>
                <SelectOption value="disk">磁盘</SelectOption>
                <SelectOption value="load">负载</SelectOption>
                <SelectOption value="pod">Pod</SelectOption>
              </Select>
            </div>
            <div v-for="(item, idx) in nodeRanking" :key="item.instance || idx" class="ranking-item">
              <Tag :color="idx === 0 ? 'red' : idx === 1 ? 'orange' : idx === 2 ? 'gold' : 'default'" class="ranking-tag">{{ idx + 1 }}</Tag>
              <span class="ranking-name">{{ item.instance || item.node || '-' }}</span>
              <div class="ranking-bar">
                <Progress
                  :percent="toPercent(item.value, nodeMetric)"
                  :stroke-color="getBarColor(toPercent(item.value, nodeMetric))"
                  :show-info="false"
                  size="small"
                />
              </div>
              <span class="ranking-value">{{ formatValue(item.value, nodeMetric) }}</span>
            </div>
            <div v-if="nodeRanking.length === 0 && !loading" style="text-align: center; color: #8c8c8c; padding: 40px;">
              暂无数据（请确认Prometheus已配置）
            </div>
          </TabPane>
        </Tabs>
      </Spin>
    </Card>
  </div>
</template>

<style scoped>
.ranking-item {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.ranking-item:hover {
  background-color: hsl(var(--muted));
}
.ranking-tag {
  min-width: 28px;
  text-align: center;
  margin-right: 12px;
}
.ranking-name {
  width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: hsl(var(--foreground));
}
.ranking-bar {
  flex: 1;
  margin: 0 16px;
}
.ranking-value {
  min-width: 90px;
  text-align: right;
  font-family: 'Consolas', monospace;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}
</style>
