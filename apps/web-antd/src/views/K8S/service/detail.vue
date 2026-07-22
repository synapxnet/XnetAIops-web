<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Descriptions, DescriptionsItem, Tag, Table, Tabs, TabPane, Button, Space, Badge, Spin, message } from 'ant-design-vue';
import { getService, getServiceEndpoints } from '../api/service';
import YamlEditor from '../components/YamlEditor.vue';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const namespace = route.params.namespace as string;
const name = route.params.name as string;

const loading = ref(true);
const svcInfo = ref<any>(null);
const endpoints = ref<any[]>([]);
const activeTab = ref('info');

async function fetchData() {
  loading.value = true;
  try {
    const [svcRes, epRes] = await Promise.all([
      getService(clusterId, namespace, name),
      getServiceEndpoints(clusterId, namespace, name),
    ]);
    svcInfo.value = svcRes;
    endpoints.value = Array.isArray(epRes) ? epRes : [];
  } catch (e: any) { message.error('获取服务信息失败: ' + e.message); }
  finally { loading.value = false; }
}

function goBack() { router.push('/K8S/service/list'); }
onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2 style="margin:0">{{ name }}</h2>
            <Space class="mt-1">
              <Tag v-if="svcInfo?.type" :color="svcInfo.type==='ClusterIP'?'blue':svcInfo.type==='NodePort'?'green':'purple'">{{ svcInfo.type }}</Tag>
              <span style="color:#8c8c8c">{{ namespace }}</span>
            </Space>
          </div>
          <Space>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="info" tab="基本信息">
          <Card title="服务属性" class="mb-4">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ svcInfo?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ svcInfo?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="类型">{{ svcInfo?.type }}</DescriptionsItem>
              <DescriptionsItem label="Cluster IP">{{ svcInfo?.clusterIP || '-' }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ svcInfo?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>

          <Card v-if="svcInfo?.ports" title="端口" class="mb-4">
            <Table :data-source="svcInfo.ports" :pagination="false" row-key="port" size="small">
              <Table.Column title="名称" dataIndex="name" />
              <Table.Column title="端口" dataIndex="port" />
              <Table.Column title="目标端口" dataIndex="targetPort" />
              <Table.Column title="NodePort" dataIndex="nodePort" />
              <Table.Column title="协议" dataIndex="protocol" />
            </Table>
          </Card>

          <Card v-if="svcInfo?.selector" title="选择器">
            <Tag v-for="(v, k) in svcInfo.selector" :key="k" color="blue">{{ k }}={{ v }}</Tag>
          </Card>
        </TabPane>

        <TabPane key="endpoints" :tab="`Endpoints (${endpoints.length})`">
          <Card>
            <Table :data-source="endpoints" :pagination="false" row-key="ip" size="small">
              <Table.Column title="IP" dataIndex="ip" />
              <Table.Column title="Pod" dataIndex="podName" />
              <Table.Column title="节点" dataIndex="nodeName" />
              <Table.Column title="就绪" key="ready">
                <template #default="{ record }">
                  <Badge :status="record.ready ? 'success' : 'error'" />{{ record.ready ? '是' : '否' }}
                </template>
              </Table.Column>
              <Table.Column title="端口" key="ports">
                <template #default="{ record }">
                  <Tag v-for="(p, i) in (record.ports || [])" :key="i" size="small">{{ p }}</Tag>
                </template>
              </Table.Column>
            </Table>
          </Card>
        </TabPane>

        <TabPane key="yaml" tab="YAML">
          <Card>
            <YamlEditor :model-value="svcInfo?.yaml || ''" :read-only="true" height="600px" />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
