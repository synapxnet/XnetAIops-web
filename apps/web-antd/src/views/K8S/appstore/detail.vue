<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Button, Tag, Space, Descriptions, DescriptionsItem, Table, Spin, message } from 'ant-design-vue';
import { getHelmAppDetail } from '../api/helm';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.query.clusterId);
const repoId = Number(route.query.repoId);
const chartName = route.query.chartName as string;

const loading = ref(true);
const app = ref<any>(null);

const versionColumns = [
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '应用版本', dataIndex: 'appVersion', key: 'appVersion' },
  { title: '发布时间', dataIndex: 'created', key: 'created', width: 200 },
  { title: '操作', key: 'action', width: 120 },
];

async function fetchData() {
  loading.value = true;
  try {
    app.value = await getHelmAppDetail(clusterId, chartName, repoId);
  } catch (e: any) { message.error('获取应用详情失败: ' + e.message); }
  finally { loading.value = false; }
}

function goInstall(version?: string) {
  router.push({
    path: '/K8S/appstore/install',
    query: {
      clusterId,
      repoId,
      chartName,
      chartVersion: version || app.value?.version,
    },
  });
}

function goBack() { router.push('/K8S/appstore/index'); }
onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="display:flex;align-items:center">
            <div style="width:64px;height:64px;border-radius:12px;background:#f0f5ff;display:flex;align-items:center;justify-content:center;margin-right:16px;flex-shrink:0">
              <img v-if="app?.icon" :src="app.icon" style="width:48px;height:48px;object-fit:contain" />
              <span v-else style="font-size:28px;color:#1890ff;font-weight:bold">{{ (chartName || '?')[0].toUpperCase() }}</span>
            </div>
            <div>
              <h2 style="margin:0">{{ chartName }}</h2>
              <div style="color:#8c8c8c;margin-top:4px">{{ app?.description || '暂无描述' }}</div>
              <div style="margin-top:8px">
                <Tag v-for="kw in (app?.keywords || [])" :key="kw">{{ kw }}</Tag>
              </div>
            </div>
          </div>
          <Space>
            <Button type="primary" size="large" @click="goInstall()">部署</Button>
            <Button @click="goBack">返回</Button>
          </Space>
        </div>
      </Card>

      <Card title="应用信息" class="mb-4">
        <Descriptions bordered :column="2" size="small">
          <DescriptionsItem label="Chart名称">{{ chartName }}</DescriptionsItem>
          <DescriptionsItem label="最新版本">{{ app?.version || '-' }}</DescriptionsItem>
          <DescriptionsItem label="应用版本">{{ app?.appVersion || '-' }}</DescriptionsItem>
          <DescriptionsItem label="版本数">{{ app?.versionCount || '-' }}</DescriptionsItem>
          <DescriptionsItem label="主页" :span="2">
            <a v-if="app?.home" :href="app.home" target="_blank">{{ app.home }}</a>
            <span v-else>-</span>
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <Card title="版本列表">
        <Table :columns="versionColumns" :data-source="app?.versions || []" row-key="version" :pagination="{ pageSize: 10 }" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <Button type="link" size="small" @click="goInstall(record.version)">部署</Button>
            </template>
          </template>
        </Table>
      </Card>
    </Spin>
  </div>
</template>
