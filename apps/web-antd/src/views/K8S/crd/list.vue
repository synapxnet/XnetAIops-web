<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Tag, Space, Button, Select, SelectOption, message } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getCrds } from '../api/crd';
import type { K8sCluster } from '../api/types';

const router = useRouter();
const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const crds = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: 'Group', dataIndex: 'group', key: 'group', width: 200 },
  { title: 'Kind', dataIndex: 'kind', key: 'kind', width: 150 },
  { title: 'Scope', dataIndex: 'scope', key: 'scope', width: 120 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter(c => c.status === 'active');
    if (active.length > 0) { selectedClusterId.value = active[0]!.id; fetchData(); }
  } catch { message.error('获取集群列表失败'); }
}

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getCrds(selectedClusterId.value);
    crds.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取CRD列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function goInstances(r: any) {
  router.push({
    path: `/K8S/crd/instances`,
    query: {
      clusterId: selectedClusterId.value!,
      crdName: r.name,
      group: r.group,
      version: r.version,
      plural: r.plural,
      scope: r.scope,
      kind: r.kind,
    },
  });
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="自定义资源 (CRD)">
      <template #extra>
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchData(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="crds" :loading="loading" row-key="name" :scroll="{ x: 1000 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a @click="goInstances(record)">{{ record.name }}</a></template>
          <template v-if="column.key === 'scope'">
            <Tag :color="record.scope === 'Namespaced' ? 'blue' : 'green'">{{ record.scope }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" @click="goInstances(record)">查看实例</Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
