<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Space, Button, Select, SelectOption, Modal, Switch, Form, FormItem, Input, InputNumber, message } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, toggleAlertRule } from '../api/monitoring';
import type { K8sCluster } from '../api/types';

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const rules = ref<any[]>([]);
const showModal = ref(false);
const editingRule = ref<any>(null);
const formData = ref({
  name: '',
  description: '',
  severity: 'warning',
  resourceType: 'node',
  metricName: '',
  condition: '>',
  threshold: 80,
  duration: '5m',
  enabled: true,
  notifyChannels: '[]',
});

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '告警级别', key: 'severity', width: 100 },
  { title: '资源类型', dataIndex: 'resourceType', key: 'resourceType', width: 100 },
  { title: '指标', dataIndex: 'metricName', key: 'metricName', width: 200 },
  { title: '条件', key: 'condition', width: 120 },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', width: 100 },
  { title: '状态', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const severityColors: Record<string, string> = { critical: 'red', warning: 'orange', info: 'blue' };

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
    const res = await getAlertRules(selectedClusterId.value);
    rules.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取告警规则失败: ' + e.message); }
  finally { loading.value = false; }
}

function openCreate() {
  editingRule.value = null;
  formData.value = { name: '', description: '', severity: 'warning', resourceType: 'node', metricName: '', condition: '>', threshold: 80, duration: '5m', enabled: true, notifyChannels: '[]' };
  showModal.value = true;
}

function openEdit(r: any) {
  editingRule.value = r;
  formData.value = { ...r };
  showModal.value = true;
}

async function handleSave() {
  if (!selectedClusterId.value) return;
  try {
    if (editingRule.value) {
      await updateAlertRule(selectedClusterId.value, editingRule.value.id, formData.value);
      message.success('更新成功');
    } else {
      await createAlertRule(selectedClusterId.value, formData.value);
      message.success('创建成功');
    }
    showModal.value = false;
    fetchData();
  } catch (e: any) { message.error('保存失败: ' + e.message); }
}

async function handleToggle(r: any, enabled: boolean) {
  try {
    await toggleAlertRule(selectedClusterId.value!, r.id, enabled);
    message.success(enabled ? '已启用' : '已禁用');
    fetchData();
  } catch (e: any) { message.error('操作失败: ' + e.message); }
}

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除告警规则「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteAlertRule(selectedClusterId.value!, r.id); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="告警规则">
      <template #extra>
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchData(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="openCreate">创建规则</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="rules" :loading="loading" row-key="id" :scroll="{ x: 1000 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'severity'">
            <Tag :color="severityColors[record.severity] || 'default'">{{ record.severity }}</Tag>
          </template>
          <template v-if="column.key === 'condition'">
            {{ record.condition }} {{ record.threshold }}
          </template>
          <template v-if="column.key === 'enabled'">
            <Switch :checked="record.enabled" size="small" @change="(v: boolean) => handleToggle(record, v)" />
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openEdit(record)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="showModal" :title="editingRule ? '编辑告警规则' : '创建告警规则'" @ok="handleSave" width="600px">
      <Form layout="vertical">
        <FormItem label="规则名称">
          <Input v-model:value="formData.name" placeholder="如: 节点CPU使用率过高" />
        </FormItem>
        <FormItem label="描述">
          <Input v-model:value="formData.description" placeholder="描述此告警规则" />
        </FormItem>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <FormItem label="告警级别">
            <Select v-model:value="formData.severity">
              <SelectOption value="critical">严重</SelectOption>
              <SelectOption value="warning">警告</SelectOption>
              <SelectOption value="info">信息</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="资源类型">
            <Select v-model:value="formData.resourceType">
              <SelectOption value="cluster">集群</SelectOption>
              <SelectOption value="node">节点</SelectOption>
              <SelectOption value="pod">Pod</SelectOption>
              <SelectOption value="deployment">Deployment</SelectOption>
            </Select>
          </FormItem>
        </div>
        <FormItem label="指标名称">
          <Input v-model:value="formData.metricName" placeholder="如: node_cpu_usage, pod_restart_count" />
        </FormItem>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <FormItem label="条件">
            <Select v-model:value="formData.condition">
              <SelectOption value=">">&gt;</SelectOption>
              <SelectOption value=">=">&gt;=</SelectOption>
              <SelectOption value="<">&lt;</SelectOption>
              <SelectOption value="<=">&lt;=</SelectOption>
              <SelectOption value="==">==</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="阈值">
            <InputNumber v-model:value="formData.threshold" style="width:100%" />
          </FormItem>
          <FormItem label="持续时间">
            <Input v-model:value="formData.duration" placeholder="如: 5m, 10m" />
          </FormItem>
        </div>
      </Form>
    </Modal>
  </div>
</template>
