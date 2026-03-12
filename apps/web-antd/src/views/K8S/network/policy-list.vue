<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getNetworkPolicies, deleteNetworkPolicy, createNetworkPolicy } from '../api/network';
import K8sSelector from '../components/K8sSelector.vue';
import YamlEditor from '../components/YamlEditor.vue';

const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const loading = ref(false);
const policies = ref<any[]>([]);

// Create state
const createVisible = ref(false);
const createYaml = ref('');
const createLoading = ref(false);

function openCreate() {
  createYaml.value = '';
  createVisible.value = true;
}

async function handleCreate() {
  if (!createYaml.value.trim()) { message.warning('请输入YAML内容'); return; }
  if (!selectedClusterId.value || !selectedNamespace.value) { message.warning('请选择集群和命名空间'); return; }
  createLoading.value = true;
  try {
    await createNetworkPolicy(selectedClusterId.value, selectedNamespace.value, createYaml.value);
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
  { title: '策略类型', key: 'policyTypes', width: 200 },
  { title: '入站规则', dataIndex: 'ingressRuleCount', key: 'ingressRuleCount', width: 100 },
  { title: '出站规则', dataIndex: 'egressRuleCount', key: 'egressRuleCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getNetworkPolicies(selectedClusterId.value, selectedNamespace.value);
    policies.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取网络策略列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除NetworkPolicy「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteNetworkPolicy(selectedClusterId.value!, selectedNamespace.value, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="网络策略 (NetworkPolicy)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="openCreate">创建</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="policies" :loading="loading" row-key="name" :scroll="{ x: 900 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'policyTypes'">
            <Tag v-for="t in (record.policyTypes || [])" :key="t" :color="t === 'Ingress' ? 'green' : 'orange'">{{ t }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建NetworkPolicy Modal -->
    <Modal v-model:open="createVisible" title="创建网络策略" :confirm-loading="createLoading" @ok="handleCreate" :width="700">
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">YAML</label>
        <YamlEditor v-model="createYaml" height="400px" />
      </div>
    </Modal>
  </div>
</template>
