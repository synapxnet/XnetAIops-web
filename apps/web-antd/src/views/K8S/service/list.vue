<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Table, Tag, Space, Button, Modal, message,
} from 'ant-design-vue';
import { getServices, deleteService } from '../api/service';
import K8sSelector from '../components/K8sSelector.vue';

const router = useRouter();
const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const services = ref<any[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 110 },
  { title: 'Cluster IP', dataIndex: 'clusterIP', key: 'clusterIP', width: 140 },
  { title: '端口', key: 'ports', width: 200 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const res = await getServices(selectedClusterId.value, selectedNamespace.value);
    services.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取服务列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function goDetail(r: any) { router.push(`/K8S/service/detail/${selectedClusterId.value}/${r.namespace}/${r.name}`); }
function goCreate() { router.push(`/K8S/service/create?clusterId=${selectedClusterId.value}&namespace=${selectedNamespace.value}`); }

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除Service「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteService(selectedClusterId.value!, r.namespace, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="服务 (Service)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="goCreate">创建服务</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="services" :loading="loading" row-key="name" :scroll="{ x: 1100 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a @click="goDetail(record)">{{ record.name }}</a></template>
          <template v-if="column.key === 'type'">
            <Tag :color="record.type === 'ClusterIP' ? 'blue' : record.type === 'NodePort' ? 'green' : record.type === 'LoadBalancer' ? 'purple' : 'default'">{{ record.type }}</Tag>
          </template>
          <template v-if="column.key === 'ports'">
            <Tag v-for="(p, i) in (record.ports || [])" :key="i" size="small" style="margin:2px">
              {{ p.port }}{{ p.targetPort ? ':' + p.targetPort : '' }}{{ p.nodePort ? '→' + p.nodePort : '' }}/{{ p.protocol || 'TCP' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="goDetail(record)">详情</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
