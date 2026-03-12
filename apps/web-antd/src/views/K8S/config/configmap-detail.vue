<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Descriptions, DescriptionsItem, Tag, Tabs, TabPane, Button, Space, Spin, message } from 'ant-design-vue';
import { getConfigMap } from '../api/config';
import YamlEditor from '../components/YamlEditor.vue';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const namespace = route.params.namespace as string;
const name = route.params.name as string;

const loading = ref(true);
const info = ref<any>(null);
const activeTab = ref('data');

async function fetchData() {
  loading.value = true;
  try { info.value = await getConfigMap(clusterId, namespace, name); }
  catch (e: any) { message.error('获取ConfigMap信息失败: ' + e.message); }
  finally { loading.value = false; }
}

function goBack() { router.push('/K8S/config/configmap-list'); }
onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2 style="margin:0"><Tag color="cyan">ConfigMap</Tag>{{ name }}</h2>
            <span style="color:#8c8c8c">{{ namespace }}</span>
          </div>
          <Space><Button @click="fetchData">刷新</Button><Button @click="goBack">返回</Button></Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="data" tab="数据">
          <Card>
            <div v-if="info?.data">
              <div v-for="(value, key) in info.data" :key="key" style="margin-bottom:16px">
                <div style="font-weight:500;margin-bottom:4px;color:#262626">{{ key }}</div>
                <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:12px;font-family:monospace;max-height:300px;overflow:auto;white-space:pre-wrap">{{ value }}</pre>
              </div>
            </div>
            <div v-else style="color:#8c8c8c">无数据</div>
          </Card>
        </TabPane>

        <TabPane key="info" tab="属性">
          <Card>
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ info?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ info?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ info?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>
          <Card v-if="info?.labels" title="标签" class="mt-4">
            <Tag v-for="(v, k) in info.labels" :key="k" color="blue">{{ k }}={{ v }}</Tag>
          </Card>
        </TabPane>

        <TabPane key="yaml" tab="YAML">
          <Card>
            <YamlEditor :model-value="info?.yaml || ''" :read-only="true" height="600px" theme="light" />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
