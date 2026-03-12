<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Button, Modal, Form, FormItem, Input, Select, Space, message } from 'ant-design-vue';
import { getRacks, createRack, deleteRack } from '../api/host';
import { getClusters } from '../../CLM/api/cluster';
import type { Rack } from '../api/types';
import type { Cluster } from '../../CLM/api/types';

const loading = ref(false);
const racks = ref<Rack[]>([]);
const clusters = ref<Cluster[]>([]);
const selectedClusterId = ref<number | undefined>(undefined);
const showModal = ref(false);
const newRack = ref({ rackName: '', description: '' });

const columns = [
  { title: '机架名称', dataIndex: 'rackName', key: 'rackName' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '操作', key: 'action', width: 120 },
];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : (res as any)?.data || [];
    if (clusters.value.length > 0 && !selectedClusterId.value) {
      selectedClusterId.value = clusters.value[0]!.id;
      fetchRacks();
    }
  } catch (_e) {}
}

async function fetchRacks() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getRacks(selectedClusterId.value);
    racks.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取机架列表失败');
  } finally {
    loading.value = false;
  }
}

function handleClusterChange() {
  fetchRacks();
}

async function handleCreateRack() {
  if (!newRack.value.rackName || !selectedClusterId.value) {
    message.warning('请填写机架名称');
    return;
  }
  try {
    await createRack({ clusterId: selectedClusterId.value, ...newRack.value });
    message.success('机架创建成功');
    showModal.value = false;
    newRack.value = { rackName: '', description: '' };
    fetchRacks();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

function handleDelete(record: Rack) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除机架「${record.rackName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRack(record.id);
        message.success('删除成功');
        fetchRacks();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => {
  fetchClusters();
});
</script>

<template>
  <div class="p-4">
    <Card title="机架管理">
      <template #extra>
        <Space>
          <Select
            v-model:value="selectedClusterId"
            placeholder="选择集群"
            style="width: 200px"
            :options="clusters.map(c => ({ label: c.clusterName, value: c.id }))"
            @change="handleClusterChange"
          />
          <Button type="primary" @click="showModal = true">新增机架</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="racks" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="showModal" title="新增机架" @ok="handleCreateRack">
      <Form layout="vertical">
        <FormItem label="机架名称" required>
          <Input v-model:value="newRack.rackName" placeholder="如: /rack1" />
        </FormItem>
        <FormItem label="描述">
          <Input v-model:value="newRack.description" placeholder="机架描述" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
