<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Space, Button, Modal, Input, message } from 'ant-design-vue';
import { getConfigMaps, createConfigMap, deleteConfigMap } from '../api/config';
import K8sSelector from '../components/K8sSelector.vue';

const createVisible = ref(false);
const createName = ref('');
const createData = ref<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
const createLoading = ref(false);

const router = useRouter();
const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const configMaps = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '数据条目', dataIndex: 'dataCount', key: 'dataCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getConfigMaps(selectedClusterId.value, selectedNamespace.value);
    configMaps.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取ConfigMap列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function goDetail(r: any) { router.push(`/K8S/config/configmap-detail/${selectedClusterId.value}/${r.namespace}/${r.name}`); }

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除ConfigMap「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteConfigMap(selectedClusterId.value!, r.namespace, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

function openCreate() {
  createName.value = '';
  createData.value = [{ key: '', value: '' }];
  createVisible.value = true;
}

function addDataEntry() { createData.value.push({ key: '', value: '' }); }
function removeDataEntry(idx: number) { createData.value.splice(idx, 1); }

async function handleCreate() {
  if (!createName.value.trim()) { message.warning('请输入名称'); return; }
  const dataMap: Record<string, string> = {};
  for (const entry of createData.value) {
    if (entry.key.trim()) dataMap[entry.key.trim()] = entry.value;
  }
  createLoading.value = true;
  try {
    await createConfigMap(selectedClusterId.value!, selectedNamespace.value, createName.value.trim(), dataMap);
    message.success('创建成功');
    createVisible.value = false;
    fetchData();
  } catch (e: any) { message.error('创建失败: ' + e.message); }
  finally { createLoading.value = false; }
}
</script>

<template>
  <div class="p-4">
    <Card title="配置字典 (ConfigMap)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="openCreate">创建ConfigMap</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="configMaps" :loading="loading" row-key="name" :scroll="{ x: 800 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a @click="goDetail(record)">{{ record.name }}</a></template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="goDetail(record)">详情</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create ConfigMap Modal -->
    <Modal v-model:open="createVisible" title="创建ConfigMap" :confirm-loading="createLoading" @ok="handleCreate" width="600px">
      <div style="margin-bottom:12px">
        <label>名称</label>
        <Input v-model:value="createName" placeholder="configmap名称" style="margin-top:4px" />
      </div>
      <div style="margin-bottom:8px">
        <label>数据 (Key-Value)</label>
      </div>
      <div v-for="(entry, idx) in createData" :key="idx" style="display:flex;gap:8px;margin-bottom:8px">
        <Input v-model:value="entry.key" placeholder="Key" style="width:200px" />
        <Input v-model:value="entry.value" placeholder="Value" style="flex:1" />
        <Button v-if="createData.length > 1" size="small" danger @click="removeDataEntry(idx)">删除</Button>
      </div>
      <Button size="small" @click="addDataEntry">+ 添加条目</Button>
    </Modal>
  </div>
</template>
