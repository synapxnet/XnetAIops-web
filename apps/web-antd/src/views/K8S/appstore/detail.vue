<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Button,
  Tag,
  Space,
  Descriptions,
  DescriptionsItem,
  Table,
  Spin,
  Alert,
} from 'ant-design-vue';
import { getHelmAppDetail } from '../api/helm';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.query.clusterId);
const repoId = Number(route.query.repoId);
const chartName = route.query.chartName as string;
/** 目录详情必须关联具体集群、仓库和应用。Catalog details require a cluster, repository and chart. */
const validContext =
  typeof route.query.clusterId === 'string' &&
  Number.isSafeInteger(clusterId) &&
  clusterId > 0 &&
  typeof route.query.repoId === 'string' &&
  Number.isSafeInteger(repoId) &&
  repoId > 0 &&
  typeof chartName === 'string' &&
  Boolean(chartName.trim());

const loading = ref(false);
const app = ref<any>(null);
const loadError = ref('');

const versionColumns = [
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '应用版本', dataIndex: 'appVersion', key: 'appVersion' },
  { title: '发布时间', dataIndex: 'created', key: 'created', width: 200 },
  { title: '操作', key: 'action', width: 120 },
];

/** 有效入口才读取详情，并保留页面内重试状态。Load valid chart details and retain an inline retry state. */
async function fetchData() {
  if (!validContext) return;
  loading.value = true;
  loadError.value = '';
  try {
    app.value = await getHelmAppDetail(clusterId, chartName, repoId);
    if (!app.value)
      loadError.value = '当前应用已不可用，请返回应用目录重新选择。';
  } catch {
    app.value = null;
    loadError.value = '暂时无法读取应用详情，请重试。';
  } finally {
    loading.value = false;
  }
}

/** 仅允许从已加载的应用进入部署。Open deployment only for a loaded chart. */
function goInstall(version?: string) {
  if (!validContext || !app.value || loading.value) return;
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

/** 返回应用目录以重新选择资源。Return to the catalog to select a resource. */
function goBack() {
  router.push('/K8S/appstore/index');
}
onMounted(fetchData);
</script>

<template>
  <BusinessPage
    title="应用详情"
    description="将状态、配置与关联资料放在一起，继续处理当前资源。"
    family="详情"
    route-key="/K8S/appstore/detail"
  >
    <div class="p-4">
      <Alert v-if="!validContext" type="info" show-icon message="请先选择应用">
        <template #action
          ><Button @click="goBack">返回应用目录</Button></template
        >
      </Alert>
      <Alert
        v-else-if="loadError"
        type="warning"
        show-icon
        :message="loadError"
      >
        <template #action
          ><Space
            ><Button @click="fetchData">重试</Button
            ><Button @click="goBack">返回应用目录</Button></Space
          ></template
        >
      </Alert>
      <Spin v-else :spinning="loading">
        <Card class="mb-4">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            "
          >
            <div style="display: flex; align-items: center">
              <div
                style="
                  width: 64px;
                  height: 64px;
                  border-radius: 12px;
                  background: hsl(var(--primary) / 10%);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-right: 16px;
                  flex-shrink: 0;
                "
              >
                <img
                  v-if="app?.icon"
                  :src="app.icon"
                  style="width: 48px; height: 48px; object-fit: contain"
                />
                <span
                  v-else
                  style="font-size: 28px; color: #1890ff; font-weight: bold"
                  >{{ (chartName || '?')[0].toUpperCase() }}</span
                >
              </div>
              <div>
                <h2 style="margin: 0">{{ chartName }}</h2>
                <div style="color: #8c8c8c; margin-top: 4px">
                  {{ app?.description || '暂无描述' }}
                </div>
                <div style="margin-top: 8px">
                  <Tag v-for="kw in app?.keywords || []" :key="kw">{{
                    kw
                  }}</Tag>
                </div>
              </div>
            </div>
            <Space>
              <Button
                type="primary"
                size="large"
                :disabled="!app || loading"
                @click="goInstall()"
                >部署</Button
              >
              <Button @click="goBack">返回</Button>
            </Space>
          </div>
        </Card>

        <Card title="应用信息" class="mb-4">
          <Descriptions bordered :column="2" size="small">
            <DescriptionsItem label="Chart名称">{{
              chartName
            }}</DescriptionsItem>
            <DescriptionsItem label="最新版本">{{
              app?.version || '-'
            }}</DescriptionsItem>
            <DescriptionsItem label="应用版本">{{
              app?.appVersion || '-'
            }}</DescriptionsItem>
            <DescriptionsItem label="版本数">{{
              app?.versionCount || '-'
            }}</DescriptionsItem>
            <DescriptionsItem label="主页" :span="2">
              <a v-if="app?.home" :href="app.home" target="_blank">{{
                app.home
              }}</a>
              <span v-else>-</span>
            </DescriptionsItem>
          </Descriptions>
        </Card>

        <Card title="版本列表">
          <Table
            :columns="versionColumns"
            :data-source="app?.versions || []"
            row-key="version"
            :pagination="{ pageSize: 10 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button
                  type="link"
                  size="small"
                  @click="goInstall(record.version)"
                  >部署</Button
                >
              </template>
            </template>
          </Table>
        </Card>
      </Spin>
    </div>
  </BusinessPage>
</template>
