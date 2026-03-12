<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getPVCs, deletePVC } from '../api/storage';
import K8sSelector from '../components/K8sSelector.vue';

const router = useRouter();
const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const pvcs = ref<any[]>([]);

const statusColor: Record<string, string> = { Bound: 'green', Pending: 'orange', Lost: 'red' };
const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '状态', key: 'status', width: 80 },
  { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 100 },
  { title: '访问模式', key: 'accessModes', width: 140 },
  { title: '存储类', dataIndex: 'storageClassName', key: 'storageClassName', width: 140 },
  { title: 'Volume', dataIndex: 'volumeName', key: 'volumeName', width: 160, ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getPVCs(selectedClusterId.value, selectedNamespace.value);
    pvcs.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取PVC列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function goCreate() { router.push(`/K8S/storage/pvc-create?clusterId=${selectedClusterId.value}&namespace=${selectedNamespace.value}`); }

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除PVC「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deletePVC(selectedClusterId.value!, r.namespace, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="存储卷声明 (PVC)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="goCreate">创建PVC</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="pvcs" :loading="loading" row-key="name" :scroll="{ x: 1200 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColor[record.status] || 'default'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'accessModes'">
            <Tag v-for="m in (record.accessModes || [])" :key="m" size="small">{{ m }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
