<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Descriptions, DescriptionsItem, Tag, Button, Tabs, TabPane, Table, message } from 'ant-design-vue';
import { getCluster, getClusterVariables } from '../api/cluster';
import type { Cluster, ClusterVariable } from '../api/types';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const cluster = ref<Cluster | null>(null);
const variables = ref<ClusterVariable[]>([]);

const statusColorMap: Record<string, string> = {
  running: 'green',
  inactive: 'default',
  configuring: 'blue',
  error: 'red',
  stopped: 'orange',
};

const variableColumns = [
  { title: '变量名', dataIndex: 'variableName', key: 'variableName' },
  { title: '变量值', dataIndex: 'variableValue', key: 'variableValue' },
];

async function fetchData() {
  const id = Number(route.params.id);
  loading.value = true;
  try {
    const res = await getCluster(id);
    cluster.value = (res as any)?.data || res;
    const varsRes = await getClusterVariables(id);
    variables.value = Array.isArray(varsRes) ? varsRes : (varsRes as any)?.data || [];
  } catch (e: any) {
    message.error('获取集群详情失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/CLM/cluster/list');
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <Card :loading="loading">
      <template #title>
        <Button type="link" @click="goBack" style="padding-left: 0">← 返回列表</Button>
        <span v-if="cluster">{{ cluster.clusterName }}</span>
      </template>
      <template v-if="cluster">
        <Tabs>
          <TabPane key="info" tab="基本信息">
            <Descriptions bordered :column="2">
              <DescriptionsItem label="集群名称">{{ cluster.clusterName }}</DescriptionsItem>
              <DescriptionsItem label="集群编码">{{ cluster.clusterCode }}</DescriptionsItem>
              <DescriptionsItem label="集群类型">{{ cluster.clusterType }}</DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="statusColorMap[cluster.status] || 'default'">{{ cluster.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem label="主机数">{{ cluster.totalHosts }}</DescriptionsItem>
              <DescriptionsItem label="运行服务数">{{ cluster.runningServices }}</DescriptionsItem>
              <DescriptionsItem label="创建者">{{ cluster.createdBy || '-' }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ cluster.createdAt }}</DescriptionsItem>
              <DescriptionsItem label="描述" :span="2">{{ cluster.description || '-' }}</DescriptionsItem>
            </Descriptions>
          </TabPane>
          <TabPane key="variables" tab="集群变量">
            <Table
              :columns="variableColumns"
              :data-source="variables"
              row-key="id"
              size="small"
            />
          </TabPane>
        </Tabs>
      </template>
    </Card>
  </div>
</template>
