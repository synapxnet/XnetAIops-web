<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Descriptions, DescriptionsItem, Tag, Tabs, TabPane, Button, Space, Spin, message } from 'ant-design-vue';
import { getSecret } from '../api/config';
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
  try { info.value = await getSecret(clusterId, namespace, name); }
  catch (e: any) { message.error('获取Secret信息失败: ' + e.message); }
  finally { loading.value = false; }
}

function goBack() { router.push('/K8S/config/secret-list'); }
onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2 style="margin:0"><Tag color="orange">Secret</Tag>{{ name }}</h2>
            <Space class="mt-1">
              <span style="color:#8c8c8c">{{ namespace }}</span>
              <Tag v-if="info?.type">{{ info.type }}</Tag>
            </Space>
          </div>
          <Space><Button @click="fetchData">刷新</Button><Button @click="goBack">返回</Button></Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="data" tab="数据Key">
          <Card>
            <div v-if="info?.dataKeys && info.dataKeys.length > 0">
              <Tag v-for="key in info.dataKeys" :key="key" color="blue" style="margin:4px;padding:4px 12px">{{ key }}</Tag>
              <div style="margin-top:12px;color:#8c8c8c;font-size:12px">Secret数据已Base64编码，出于安全考虑不直接显示内容</div>
            </div>
            <div v-else style="color:#8c8c8c">无数据</div>
          </Card>
        </TabPane>

        <TabPane key="info" tab="属性">
          <Card>
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ info?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ info?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="类型">{{ info?.type }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ info?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>
        </TabPane>

        <TabPane key="yaml" tab="YAML">
          <Card>
            <YamlEditor :model-value="info?.yaml || ''" :read-only="true" height="600px" />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
