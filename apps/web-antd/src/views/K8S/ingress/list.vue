<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getIngresses, deleteIngress } from '../api/ingress';
import K8sSelector from '../components/K8sSelector.vue';

const router = useRouter();
const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const ingresses = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '域名', key: 'hosts' },
  { title: 'Ingress Class', dataIndex: 'ingressClassName', key: 'ingressClassName', width: 130 },
  { title: '地址', key: 'addresses', width: 140 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getIngresses(selectedClusterId.value, selectedNamespace.value);
    ingresses.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取路由列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function goCreate() { router.push(`/K8S/ingress/create?clusterId=${selectedClusterId.value}&namespace=${selectedNamespace.value}`); }

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除Ingress「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteIngress(selectedClusterId.value!, r.namespace, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="路由 (Ingress)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="goCreate">创建路由</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="ingresses" :loading="loading" row-key="name" :scroll="{ x: 1000 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'hosts'">
            <Tag v-for="h in (record.hosts || [])" :key="h" color="blue" size="small">{{ h }}</Tag>
          </template>
          <template v-if="column.key === 'addresses'">
            <span v-for="a in (record.addresses || [])" :key="a">{{ a }}</span>
            <span v-if="!record.addresses?.length">-</span>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
