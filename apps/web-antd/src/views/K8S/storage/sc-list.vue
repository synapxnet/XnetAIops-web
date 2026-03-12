<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Button, message } from 'ant-design-vue';
import { getStorageClasses } from '../api/storage';
import K8sSelector from '../components/K8sSelector.vue';

const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const storageClasses = ref<any[]>([]);

const columns = [
  { title: '名称', key: 'name' },
  { title: 'Provisioner', dataIndex: 'provisioner', key: 'provisioner' },
  { title: '回收策略', dataIndex: 'reclaimPolicy', key: 'reclaimPolicy', width: 100 },
  { title: '绑定模式', dataIndex: 'volumeBindingMode', key: 'volumeBindingMode', width: 160 },
  { title: '允许扩容', key: 'allowVolumeExpansion', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
];

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getStorageClasses(selectedClusterId.value);
    storageClasses.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取StorageClass列表失败: ' + e.message); }
  finally { loading.value = false; }
}
</script>

<template>
  <div class="p-4">
    <Card title="存储类 (StorageClass)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" :show-namespace="false" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="storageClasses" :loading="loading" row-key="name" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            {{ record.name }}
            <Tag v-if="record.isDefault" color="gold" size="small" class="ml-1">默认</Tag>
          </template>
          <template v-if="column.key === 'allowVolumeExpansion'">
            <Tag :color="record.allowVolumeExpansion ? 'green' : 'default'">{{ record.allowVolumeExpansion ? '是' : '否' }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
