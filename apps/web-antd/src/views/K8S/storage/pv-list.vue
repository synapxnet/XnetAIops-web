<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getPVs, deletePV } from '../api/storage';
import K8sSelector from '../components/K8sSelector.vue';

const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const pvs = ref<any[]>([]);

const statusColor: Record<string, string> = { Available: 'green', Bound: 'blue', Released: 'orange', Failed: 'red' };
const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '状态', key: 'status', width: 100 },
  { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 100 },
  { title: '访问模式', key: 'accessModes', width: 160 },
  { title: '回收策略', dataIndex: 'reclaimPolicy', key: 'reclaimPolicy', width: 100 },
  { title: '存储类', dataIndex: 'storageClassName', key: 'storageClassName', width: 140 },
  { title: '绑定PVC', key: 'claim', width: 180 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 200, ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getPVs(selectedClusterId.value);
    pvs.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取PV列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除PV「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deletePV(selectedClusterId.value!, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="持久卷 (PV)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" :show-namespace="false" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="pvs" :loading="loading" row-key="name" :scroll="{ x: 1400 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'"><Tag :color="statusColor[record.status] || 'default'">{{ record.status }}</Tag></template>
          <template v-if="column.key === 'accessModes'"><Tag v-for="m in (record.accessModes || [])" :key="m" size="small">{{ m }}</Tag></template>
          <template v-if="column.key === 'claim'">{{ record.claimNamespace ? record.claimNamespace + '/' + record.claimName : '-' }}</template>
          <template v-if="column.key === 'action'"><Button type="link" size="small" danger @click="handleDelete(record)">删除</Button></template>
        </template>
      </Table>
    </Card>
  </div>
</template>
