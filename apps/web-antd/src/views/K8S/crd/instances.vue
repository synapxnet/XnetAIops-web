<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Table, Tag, Space, Button, Select, SelectOption, Modal, message } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import { getCustomResources, deleteCustomResource } from '../api/crd';
import type { K8sCluster } from '../api/types';

const route = useRoute();
const router = useRouter();

const clusterId = ref(Number(route.query.clusterId));
const crdName = ref(route.query.crdName as string);
const group = ref(route.query.group as string);
const version = ref(route.query.version as string);
const plural = ref(route.query.plural as string);
const scope = ref(route.query.scope as string);
const kind = ref(route.query.kind as string);

const namespaces = ref<string[]>([]);
const selectedNamespace = ref('');
const loading = ref(false);
const resources = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: 'Kind', dataIndex: 'kind', key: 'kind', width: 150 },
  { title: 'API版本', dataIndex: 'apiVersion', key: 'apiVersion', width: 200 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

async function fetchNamespaces() {
  if (!clusterId.value || scope.value !== 'Namespaced') return;
  try {
    const res = await getNamespaces(clusterId.value);
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    selectedNamespace.value = namespaces.value.includes('default') ? 'default' : namespaces.value[0] || '';
    fetchData();
  } catch { message.error('获取命名空间失败'); }
}

async function fetchData() {
  if (!clusterId.value) return;
  loading.value = true;
  try {
    const ns = scope.value === 'Namespaced' ? selectedNamespace.value : undefined;
    const res = await getCustomResources(clusterId.value, crdName.value, group.value, version.value, plural.value, ns);
    resources.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取自定义资源列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try {
        await deleteCustomResource(clusterId.value, crdName.value, r.name, group.value, version.value, plural.value, r.namespace);
        message.success('删除成功');
        fetchData();
      } catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

function goBack() { router.push('/K8S/crd/list'); }

onMounted(() => {
  if (scope.value === 'Namespaced') {
    fetchNamespaces();
  } else {
    fetchData();
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="`${kind} 实例 (${crdName})`">
      <template #extra>
        <Space>
          <Select v-if="scope === 'Namespaced'" :value="selectedNamespace" style="width:150px" @change="(v: string) => { selectedNamespace = v; fetchData(); }">
            <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</SelectOption>
          </Select>
          <Button @click="fetchData">刷新</Button>
          <Button @click="goBack">返回</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="resources" :loading="loading" row-key="name" :scroll="{ x: 900 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
