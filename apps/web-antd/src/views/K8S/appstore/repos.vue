<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Space, Button, Modal, Form, FormItem, Input, message } from 'ant-design-vue';
import { Select, SelectOption } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getHelmRepos, addHelmRepo, deleteHelmRepo, syncHelmRepo } from '../api/helm';
import type { K8sCluster } from '../api/types';

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const repos = ref<any[]>([]);
const showModal = ref(false);
const formData = ref({ name: '', url: '', description: '', authType: 'none', username: '', password: '' });

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: 'URL', dataIndex: 'url', key: 'url' },
  { title: '状态', key: 'status', width: 80 },
  { title: '最后同步', dataIndex: 'lastSyncedAt', key: 'lastSyncedAt', width: 180 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
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
    const res = await getHelmRepos(selectedClusterId.value);
    repos.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取仓库列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function openAdd() {
  formData.value = { name: '', url: '', description: '', authType: 'none', username: '', password: '' };
  showModal.value = true;
}

async function handleAdd() {
  if (!formData.value.name || !formData.value.url) {
    message.warning('请填写名称和URL');
    return;
  }
  try {
    await addHelmRepo(selectedClusterId.value!, formData.value);
    message.success('仓库添加成功');
    showModal.value = false;
    fetchData();
  } catch (e: any) { message.error('添加失败: ' + e.message); }
}

async function handleSync(r: any) {
  try {
    message.loading({ content: '正在同步...', key: 'sync' });
    await syncHelmRepo(selectedClusterId.value!, r.id);
    message.success({ content: '同步成功', key: 'sync' });
    fetchData();
  } catch (e: any) { message.error({ content: '同步失败: ' + e.message, key: 'sync' }); }
}

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除仓库「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteHelmRepo(selectedClusterId.value!, r.id); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="Helm 仓库管理">
      <template #extra>
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchData(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="openAdd">添加仓库</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="repos" :loading="loading" row-key="id" :scroll="{ x: 800 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'active' ? 'green' : 'red'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleSync(record)">同步</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="showModal" title="添加 Helm 仓库" @ok="handleAdd" width="500px">
      <Form layout="vertical">
        <FormItem label="名称">
          <Input v-model:value="formData.name" placeholder="如: bitnami" />
        </FormItem>
        <FormItem label="仓库URL">
          <Input v-model:value="formData.url" placeholder="如: https://charts.bitnami.com/bitnami" />
        </FormItem>
        <FormItem label="描述">
          <Input v-model:value="formData.description" placeholder="仓库描述（可选）" />
        </FormItem>
        <FormItem label="认证方式">
          <Select v-model:value="formData.authType">
            <SelectOption value="none">无认证</SelectOption>
            <SelectOption value="basic">Basic Auth</SelectOption>
          </Select>
        </FormItem>
        <template v-if="formData.authType === 'basic'">
          <FormItem label="用户名">
            <Input v-model:value="formData.username" />
          </FormItem>
          <FormItem label="密码">
            <Input.Password v-model:value="formData.password" />
          </FormItem>
        </template>
      </Form>
    </Modal>
  </div>
</template>
