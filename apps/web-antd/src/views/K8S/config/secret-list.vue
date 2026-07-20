<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Tag, Space, Button, Select, SelectOption, Modal, Input, message } from 'ant-design-vue';
import { getSecrets, deleteSecret, createSecret } from '../api/config';
import K8sSelector from '../components/K8sSelector.vue';

const router = useRouter();
const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const secrets = ref<any[]>([]);

// Create state
const createVisible = ref(false);
const createName = ref('');
const createType = ref('Opaque');
const createData = ref<{ key: string; value: string }[]>([{ key: '', value: '' }]);
const createLoading = ref(false);

const secretTypeOptions = [
  'Opaque',
  'kubernetes.io/dockerconfigjson',
  'kubernetes.io/tls',
];

function openCreate() {
  createName.value = '';
  createType.value = 'Opaque';
  createData.value = [{ key: '', value: '' }];
  createVisible.value = true;
}

function addDataEntry() {
  createData.value.push({ key: '', value: '' });
}

function removeDataEntry(index: number) {
  createData.value.splice(index, 1);
}

async function handleCreate() {
  if (!createName.value.trim()) { message.warning('请输入Secret名称'); return; }
  if (!selectedClusterId.value || !selectedNamespace.value) { message.warning('请选择集群和命名空间'); return; }
  const dataMap: Record<string, string> = {};
  for (const entry of createData.value) {
    if (entry.key.trim()) {
      dataMap[entry.key.trim()] = entry.value;
    }
  }
  createLoading.value = true;
  try {
    await createSecret(selectedClusterId.value, selectedNamespace.value, createName.value.trim(), createType.value, dataMap);
    message.success('创建成功');
    createVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    createLoading.value = false;
  }
}

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 200 },
  { title: '数据条目', dataIndex: 'dataCount', key: 'dataCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getSecrets(selectedClusterId.value, selectedNamespace.value);
    secrets.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取Secret列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function goDetail(r: any) { router.push(`/K8S/config/secret-detail/${selectedClusterId.value}/${r.namespace}/${r.name}`); }

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除Secret「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteSecret(selectedClusterId.value!, r.namespace, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="保密字典 (Secret)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="openCreate">创建Secret</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="secrets" :loading="loading" row-key="name" :scroll="{ x: 900 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a @click="goDetail(record)">{{ record.name }}</a></template>
          <template v-if="column.key === 'type'"><Tag>{{ record.type }}</Tag></template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="goDetail(record)">详情</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建Secret Modal -->
    <Modal v-model:open="createVisible" title="创建Secret" :confirm-loading="createLoading" @ok="handleCreate" :width="640">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">名称</label>
        <Input v-model:value="createName" placeholder="请输入Secret名称" />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">类型</label>
        <Select v-model:value="createType" style="width: 100%;">
          <SelectOption v-for="t in secretTypeOptions" :key="t" :value="t">{{ t }}</SelectOption>
        </Select>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">数据条目</label>
        <div v-for="(entry, idx) in createData" :key="idx" style="display: flex; gap: 8px; margin-bottom: 8px;">
          <Input v-model:value="entry.key" placeholder="Key" style="flex: 1;" />
          <Input v-model:value="entry.value" placeholder="Value" style="flex: 1;" />
          <Button danger size="small" @click="removeDataEntry(idx)" :disabled="createData.length <= 1">删除</Button>
        </div>
        <Button type="dashed" block @click="addDataEntry">+ 添加条目</Button>
      </div>
    </Modal>
  </div>
</template>
