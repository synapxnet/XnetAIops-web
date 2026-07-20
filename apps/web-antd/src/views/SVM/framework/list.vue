<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import {
  Card, Table, Button, Space, Modal, Form, FormItem, Input, Textarea,
  InputNumber, message,
} from 'ant-design-vue';
import {
  getFrameworks, createFramework, updateFramework, deleteFramework,
  getServiceDefs, createServiceDef, updateServiceDef, deleteServiceDef,
  getRoleDefs, createRoleDef, updateRoleDef, deleteRoleDef,
} from '../api/framework';
import type { Framework, ServiceDef, RoleDef } from '../api/types';

const loading = ref(false);
const frameworks = ref<Framework[]>([]);

const columns = [
  { title: '框架名称', dataIndex: 'frameName', key: 'frameName' },
  { title: '框架编码', dataIndex: 'frameCode', key: 'frameCode', width: 150 },
  { title: '版本', dataIndex: 'frameVersion', key: 'frameVersion', width: 120 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' as const },
];

// Framework form modal
const modalVisible = ref(false);
const modalTitle = ref('创建框架');
const editingId = ref<null | number>(null);
const formState = reactive({
  frameName: '', frameCode: '', frameVersion: '', description: '',
});

// Service defs modal
const serviceModalVisible = ref(false);
const serviceModalTitle = ref('');
const serviceDefs = ref<ServiceDef[]>([]);
const serviceLoading = ref(false);
const currentFrameworkId = ref<number>(0);

const serviceColumns = [
  { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName' },
  { title: '服务标签', dataIndex: 'serviceLabel', key: 'serviceLabel' },
  { title: '版本', dataIndex: 'serviceVersion', key: 'serviceVersion', width: 100 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 200 },
];

// Service def form
const serviceFormVisible = ref(false);
const serviceFormTitle = ref('添加服务定义');
const editingServiceId = ref<null | number>(null);
const serviceForm = reactive({
  serviceName: '', serviceLabel: '', serviceVersion: '',
  description: '', packageName: '', sortOrder: 0,
});

// Role defs modal
const roleModalVisible = ref(false);
const roleModalTitle = ref('');
const roleDefs = ref<RoleDef[]>([]);
const roleLoading = ref(false);
const currentServiceDefId = ref<number>(0);

const roleColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色类型', dataIndex: 'roleType', key: 'roleType', width: 100 },
  { title: '基数', dataIndex: 'cardinality', key: 'cardinality', width: 100 },
  { title: 'JMX端口', dataIndex: 'jmxPort', key: 'jmxPort', width: 100 },
  { title: '日志文件', dataIndex: 'logFile', key: 'logFile', ellipsis: true },
  { title: '操作', key: 'action', width: 150 },
];

// Role def form
const roleFormVisible = ref(false);
const roleFormTitle = ref('添加角色定义');
const editingRoleId = ref<null | number>(null);
const roleForm = reactive({
  roleName: '', roleType: 'MASTER', cardinality: '1',
  jmxPort: 0, logFile: '',
});

// --- Framework CRUD ---
async function fetchFrameworks() {
  loading.value = true;
  try {
    const res = await getFrameworks();
    frameworks.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取框架列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  modalTitle.value = '创建框架';
  formState.frameName = '';
  formState.frameCode = '';
  formState.frameVersion = '';
  formState.description = '';
  modalVisible.value = true;
}

function showEdit(record: Framework) {
  editingId.value = record.id;
  modalTitle.value = '编辑框架';
  formState.frameName = record.frameName;
  formState.frameCode = record.frameCode;
  formState.frameVersion = record.frameVersion;
  formState.description = record.description || '';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateFramework(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createFramework({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchFrameworks();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: Framework) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除框架「${record.frameName}」吗？关联的服务定义也将被删除。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteFramework(record.id);
        message.success('删除成功');
        fetchFrameworks();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

// --- ServiceDef CRUD ---
async function showServiceDefs(record: Framework) {
  currentFrameworkId.value = record.id;
  serviceModalTitle.value = `${record.frameName} - 服务定义`;
  serviceModalVisible.value = true;
  await fetchServiceDefs();
}

async function fetchServiceDefs() {
  serviceLoading.value = true;
  try {
    const res = await getServiceDefs(currentFrameworkId.value);
    serviceDefs.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取服务定义失败: ' + e.message);
  } finally {
    serviceLoading.value = false;
  }
}

function showCreateService() {
  editingServiceId.value = null;
  serviceFormTitle.value = '添加服务定义';
  serviceForm.serviceName = '';
  serviceForm.serviceLabel = '';
  serviceForm.serviceVersion = '';
  serviceForm.description = '';
  serviceForm.packageName = '';
  serviceForm.sortOrder = 0;
  serviceFormVisible.value = true;
}

function showEditService(record: ServiceDef) {
  editingServiceId.value = record.id;
  serviceFormTitle.value = '编辑服务定义';
  serviceForm.serviceName = record.serviceName;
  serviceForm.serviceLabel = record.serviceLabel;
  serviceForm.serviceVersion = record.serviceVersion;
  serviceForm.description = record.description || '';
  serviceForm.packageName = record.packageName || '';
  serviceForm.sortOrder = record.sortOrder || 0;
  serviceFormVisible.value = true;
}

async function handleServiceSubmit() {
  try {
    if (editingServiceId.value) {
      await updateServiceDef(editingServiceId.value, { ...serviceForm });
      message.success('更新成功');
    } else {
      await createServiceDef(currentFrameworkId.value, { ...serviceForm });
      message.success('创建成功');
    }
    serviceFormVisible.value = false;
    fetchServiceDefs();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDeleteService(record: ServiceDef) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除服务定义「${record.serviceName}」吗？关联的角色定义也将被删除。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteServiceDef(record.id);
        message.success('删除成功');
        fetchServiceDefs();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

// --- RoleDef CRUD ---
async function showRoleDefs(record: ServiceDef) {
  currentServiceDefId.value = record.id;
  roleModalTitle.value = `${record.serviceName} - 角色定义`;
  roleModalVisible.value = true;
  await fetchRoleDefs();
}

async function fetchRoleDefs() {
  roleLoading.value = true;
  try {
    const res = await getRoleDefs(currentFrameworkId.value, currentServiceDefId.value);
    roleDefs.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取角色定义失败: ' + e.message);
  } finally {
    roleLoading.value = false;
  }
}

function showCreateRole() {
  editingRoleId.value = null;
  roleFormTitle.value = '添加角色定义';
  roleForm.roleName = '';
  roleForm.roleType = 'MASTER';
  roleForm.cardinality = '1';
  roleForm.jmxPort = 0;
  roleForm.logFile = '';
  roleFormVisible.value = true;
}

function showEditRole(record: RoleDef) {
  editingRoleId.value = record.id;
  roleFormTitle.value = '编辑角色定义';
  roleForm.roleName = record.roleName;
  roleForm.roleType = record.roleType;
  roleForm.cardinality = record.cardinality || '1';
  roleForm.jmxPort = record.jmxPort || 0;
  roleForm.logFile = record.logFile || '';
  roleFormVisible.value = true;
}

async function handleRoleSubmit() {
  try {
    if (editingRoleId.value) {
      await updateRoleDef(editingRoleId.value, { ...roleForm });
      message.success('更新成功');
    } else {
      await createRoleDef(currentFrameworkId.value, currentServiceDefId.value, { ...roleForm });
      message.success('创建成功');
    }
    roleFormVisible.value = false;
    fetchRoleDefs();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDeleteRole(record: RoleDef) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色定义「${record.roleName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRoleDef(record.id);
        message.success('删除成功');
        fetchRoleDefs();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => {
  fetchFrameworks();
});
</script>

<template>
  <div class="p-4">
    <Card title="框架管理">
      <template #extra>
        <Space>
          <Button @click="fetchFrameworks">刷新</Button>
          <Button type="primary" @click="showCreate">创建框架</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="frameworks"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showServiceDefs(_record as Framework)">
                服务定义
              </Button>
              <Button type="link" size="small" @click="showEdit(_record as Framework)">
                编辑
              </Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as Framework)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create/Edit Framework Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :destroy-on-close="true"
    >
      <Form layout="vertical">
        <FormItem label="框架名称" required>
          <Input v-model:value="formState.frameName" placeholder="如: Hadoop" />
        </FormItem>
        <FormItem label="框架编码" required>
          <Input v-model:value="formState.frameCode" placeholder="如: HADOOP" :disabled="!!editingId" />
        </FormItem>
        <FormItem label="版本" required>
          <Input v-model:value="formState.frameVersion" placeholder="如: 3.3.6" />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="3" />
        </FormItem>
      </Form>
    </Modal>

    <!-- Service Defs Modal -->
    <Modal
      v-model:open="serviceModalVisible"
      :title="serviceModalTitle"
      :footer="null"
      width="900px"
    >
      <div style="margin-bottom: 12px; text-align: right">
        <Button type="primary" size="small" @click="showCreateService">添加服务定义</Button>
      </div>
      <Table
        :columns="serviceColumns"
        :data-source="serviceDefs"
        :loading="serviceLoading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showRoleDefs(_record as ServiceDef)">
                角色
              </Button>
              <Button type="link" size="small" @click="showEditService(_record as ServiceDef)">
                编辑
              </Button>
              <Button type="link" size="small" danger @click="handleDeleteService(_record as ServiceDef)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- Service Def Form Modal -->
    <Modal
      v-model:open="serviceFormVisible"
      :title="serviceFormTitle"
      @ok="handleServiceSubmit"
      :destroy-on-close="true"
    >
      <Form layout="vertical">
        <FormItem label="服务名称" required>
          <Input v-model:value="serviceForm.serviceName" placeholder="如: HDFS" />
        </FormItem>
        <FormItem label="服务标签" required>
          <Input v-model:value="serviceForm.serviceLabel" placeholder="如: Hadoop分布式文件系统" />
        </FormItem>
        <FormItem label="版本">
          <Input v-model:value="serviceForm.serviceVersion" placeholder="如: 3.3.6" />
        </FormItem>
        <FormItem label="包名">
          <Input v-model:value="serviceForm.packageName" placeholder="如: hadoop-3.3.6.tar.gz" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="serviceForm.sortOrder" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="serviceForm.description" :rows="3" />
        </FormItem>
      </Form>
    </Modal>

    <!-- Role Defs Modal -->
    <Modal
      v-model:open="roleModalVisible"
      :title="roleModalTitle"
      :footer="null"
      width="850px"
    >
      <div style="margin-bottom: 12px; text-align: right">
        <Button type="primary" size="small" @click="showCreateRole">添加角色定义</Button>
      </div>
      <Table
        :columns="roleColumns"
        :data-source="roleDefs"
        :loading="roleLoading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showEditRole(_record as RoleDef)">
                编辑
              </Button>
              <Button type="link" size="small" danger @click="handleDeleteRole(_record as RoleDef)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- Role Def Form Modal -->
    <Modal
      v-model:open="roleFormVisible"
      :title="roleFormTitle"
      @ok="handleRoleSubmit"
      :destroy-on-close="true"
    >
      <Form layout="vertical">
        <FormItem label="角色名称" required>
          <Input v-model:value="roleForm.roleName" placeholder="如: NameNode" />
        </FormItem>
        <FormItem label="角色类型" required>
          <Input v-model:value="roleForm.roleType" placeholder="如: MASTER / SLAVE / CLIENT" />
        </FormItem>
        <FormItem label="基数">
          <Input v-model:value="roleForm.cardinality" placeholder="如: 1 或 1+" />
        </FormItem>
        <FormItem label="JMX端口">
          <InputNumber v-model:value="roleForm.jmxPort" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="日志文件">
          <Input v-model:value="roleForm.logFile" placeholder="如: /var/log/hadoop/namenode.log" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
