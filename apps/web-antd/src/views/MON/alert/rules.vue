<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Textarea,
  Switch,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from '../api/alert';
import type { AlertRule } from '../api/types';

const loading = ref(false);
const rules = ref<AlertRule[]>([]);

const columns = [
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '服务', dataIndex: 'serviceName', key: 'serviceName', width: 120 },
  { title: '级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 100 },
  { title: '比较方式', key: 'compare', width: 160 },
  { title: '持续时间(秒)', dataIndex: 'durationSeconds', key: 'durationSeconds', width: 120 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const levelColorMap: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  critical: 'red',
};

// Form modal
const modalVisible = ref(false);
const modalTitle = ref('创建告警规则');
const editingId = ref<null | number>(null);
const formState = reactive({
  ruleName: '',
  serviceName: '',
  expression: '',
  compareMethod: '>',
  thresholdValue: 0,
  alertLevel: 'warning',
  durationSeconds: 60,
  enabled: true,
  description: '',
});

async function fetchRules() {
  loading.value = true;
  try {
    const res = await getAlertRules();
    rules.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取告警规则失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  modalTitle.value = '创建告警规则';
  formState.ruleName = '';
  formState.serviceName = '';
  formState.expression = '';
  formState.compareMethod = '>';
  formState.thresholdValue = 0;
  formState.alertLevel = 'warning';
  formState.durationSeconds = 60;
  formState.enabled = true;
  formState.description = '';
  modalVisible.value = true;
}

function showEdit(record: AlertRule) {
  editingId.value = record.id;
  modalTitle.value = '编辑告警规则';
  formState.ruleName = record.ruleName;
  formState.serviceName = record.serviceName || '';
  formState.expression = record.expression;
  formState.compareMethod = record.compareMethod || '>';
  formState.thresholdValue = record.thresholdValue || 0;
  formState.alertLevel = record.alertLevel;
  formState.durationSeconds = record.durationSeconds;
  formState.enabled = record.enabled;
  formState.description = record.description || '';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateAlertRule(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createAlertRule({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchRules();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: AlertRule) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则「${record.ruleName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteAlertRule(record.id);
        message.success('删除成功');
        fetchRules();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

async function handleToggle(record: AlertRule) {
  try {
    await toggleAlertRule(record.id);
    message.success(record.enabled ? '已禁用' : '已启用');
    fetchRules();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

onMounted(() => {
  fetchRules();
});
</script>

<template>
  <div class="p-4">
    <Card title="告警规则">
      <template #extra>
        <Button type="primary" @click="showCreate">创建规则</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="rules"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'alertLevel'">
            <Tag :color="levelColorMap[(_record as any).alertLevel] || 'default'">
              {{ (_record as any).alertLevel }}
            </Tag>
          </template>
          <template v-if="column.key === 'compare'">
            {{ (_record as any).compareMethod }} {{ (_record as any).thresholdValue }}
          </template>
          <template v-if="column.key === 'enabled'">
            <Switch
              :checked="(_record as any).enabled"
              size="small"
              @change="handleToggle(_record as AlertRule)"
            />
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showEdit(_record as AlertRule)">
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                danger
                @click="handleDelete(_record as AlertRule)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create/Edit Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :destroy-on-close="true"
      width="600px"
    >
      <Form layout="vertical">
        <FormItem label="规则名称" required>
          <Input v-model:value="formState.ruleName" placeholder="如: CPU使用率过高" />
        </FormItem>
        <FormItem label="关联服务">
          <Input v-model:value="formState.serviceName" placeholder="如: HDFS" />
        </FormItem>
        <FormItem label="PromQL 表达式" required>
          <Textarea
            v-model:value="formState.expression"
            :rows="2"
            placeholder="如: node_cpu_usage_percent"
          />
        </FormItem>
        <Space>
          <FormItem label="比较方式">
            <Select v-model:value="formState.compareMethod" style="width: 100px">
              <SelectOption value=">">&gt;</SelectOption>
              <SelectOption value=">=">&gt;=</SelectOption>
              <SelectOption value="<">&lt;</SelectOption>
              <SelectOption value="<=">&lt;=</SelectOption>
              <SelectOption value="==">=</SelectOption>
              <SelectOption value="!=">!=</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="阈值">
            <InputNumber v-model:value="formState.thresholdValue" style="width: 120px" />
          </FormItem>
          <FormItem label="持续时间(秒)">
            <InputNumber v-model:value="formState.durationSeconds" :min="0" style="width: 120px" />
          </FormItem>
        </Space>
        <FormItem label="告警级别">
          <Select v-model:value="formState.alertLevel" style="width: 150px">
            <SelectOption value="info">Info</SelectOption>
            <SelectOption value="warning">Warning</SelectOption>
            <SelectOption value="critical">Critical</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="2" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
