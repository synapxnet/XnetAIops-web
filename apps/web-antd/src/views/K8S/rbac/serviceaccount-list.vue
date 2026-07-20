<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getServiceAccounts, deleteServiceAccount } from '../api/rbac';
import K8sSelector from '../components/K8sSelector.vue';

const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const loading = ref(false);
const serviceAccounts = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: 'Secret数', dataIndex: 'secretCount', key: 'secretCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getServiceAccounts(selectedClusterId.value, selectedNamespace.value);
    serviceAccounts.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取ServiceAccount列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除ServiceAccount「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteServiceAccount(selectedClusterId.value!, selectedNamespace.value, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="服务账户 (ServiceAccount)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="serviceAccounts" :loading="loading" row-key="name" :scroll="{ x: 700 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
