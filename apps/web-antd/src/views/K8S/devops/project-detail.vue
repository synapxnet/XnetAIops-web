<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Tabs,
  TabPane,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Form,
  FormItem,
  Input,
  InputPassword,
  Select,
  SelectOption,
  Descriptions,
  DescriptionsItem,
  Spin,
  Popconfirm,
} from 'ant-design-vue';
import {
  getDevopsProject,
  updateDevopsProject,
  deleteDevopsProject,
  testJenkinsConnection,
  getPipelines,
  deletePipeline,
  triggerPipelineRun,
  getPipelineRunStages,
  getCredentials,
  createCredential,
  deleteCredential,
} from '../api/devops';
import StagePipeline from '../components/StagePipeline.vue';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => Number(route.params.projectId));

// ====== Shared state ======
const loading = ref(true);
const activeTab = ref('pipelines');
const project = ref<any>(null);

// ====== Tab 1: Pipelines ======
const pipelines = ref<any[]>([]);
const pipelinesLoading = ref(false);
const pipelineStagesMap = ref<Record<number, any[]>>({});

const pipelineColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '最新运行', dataIndex: 'lastRunStatus', key: 'lastRunStatus', width: 280 },
  { title: '最后运行时间', dataIndex: 'lastRunTime', key: 'lastRunTime', width: 180 },
  { title: '操作', key: 'action', width: 160 },
];

const statusColorMap: Record<string, string> = {
  active: 'green',
  disabled: 'default',
  error: 'red',
};

const runStatusColorMap: Record<string, string> = {
  success: 'green',
  failed: 'red',
  running: 'blue',
  aborted: 'orange',
  pending: 'default',
};

async function fetchPipelines() {
  pipelinesLoading.value = true;
  try {
    const res = await getPipelines(projectId.value);
    pipelines.value = Array.isArray(res) ? res : (res as any)?.data || [];
    // Fetch stages for pipelines with a latest run
    const stagesPromises = pipelines.value
      .filter((p: any) => p.lastRunId)
      .map(async (p: any) => {
        try {
          const stages = await getPipelineRunStages(projectId.value, p.id, p.lastRunId);
          pipelineStagesMap.value[p.id] = Array.isArray(stages) ? stages : (stages as any)?.data || [];
        } catch {
          // ignore - will fallback to Tag display
        }
      });
    await Promise.all(stagesPromises);
  } catch (e: any) {
    message.error('获取流水线列表失败: ' + e.message);
  } finally {
    pipelinesLoading.value = false;
  }
}

function goCreatePipeline() {
  router.push(`/K8S/devops/projects/${projectId.value}/pipeline/create`);
}

function goPipelineDetail(record: any) {
  router.push(`/K8S/devops/projects/${projectId.value}/pipelines/${record.id}`);
}

async function handleRunPipeline(record: any) {
  try {
    await triggerPipelineRun(projectId.value, record.id);
    message.success(`流水线 "${record.name}" 已触发运行`);
    fetchPipelines();
  } catch (e: any) {
    message.error('触发运行失败: ' + e.message);
  }
}

async function handleDeletePipeline(record: any) {
  try {
    await deletePipeline(projectId.value, record.id);
    message.success('删除成功');
    fetchPipelines();
  } catch (e: any) {
    message.error('删除失败: ' + e.message);
  }
}

// ====== Tab 2: Credentials ======
const credentials = ref<any[]>([]);
const credentialsLoading = ref(false);
const credentialModalVisible = ref(false);
const credentialSubmitting = ref(false);
const credentialForm = reactive<Record<string, any>>({
  name: '',
  type: 'username-password',
  description: '',
  username: '',
  password: '',
  privateKey: '',
  passphrase: '',
  token: '',
  kubeconfig: '',
});

const credentialColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 160 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100 },
];

const credentialTypeLabels: Record<string, string> = {
  'username-password': '用户名/密码',
  'ssh-key': 'SSH 密钥',
  'access-token': '访问令牌',
  'kubeconfig': 'Kubeconfig',
};

async function fetchCredentials() {
  credentialsLoading.value = true;
  try {
    const res = await getCredentials(projectId.value);
    credentials.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取凭证列表失败: ' + e.message);
  } finally {
    credentialsLoading.value = false;
  }
}

function openCredentialModal() {
  credentialForm.name = '';
  credentialForm.type = 'username-password';
  credentialForm.description = '';
  credentialForm.username = '';
  credentialForm.password = '';
  credentialForm.privateKey = '';
  credentialForm.passphrase = '';
  credentialForm.token = '';
  credentialForm.kubeconfig = '';
  credentialModalVisible.value = true;
}

async function handleCreateCredential() {
  if (!credentialForm.name) {
    message.warning('请输入凭证名称');
    return;
  }
  credentialSubmitting.value = true;
  try {
    const data: Record<string, any> = {
      name: credentialForm.name,
      type: credentialForm.type,
      description: credentialForm.description,
    };
    if (credentialForm.type === 'username-password') {
      data.username = credentialForm.username;
      data.password = credentialForm.password;
    } else if (credentialForm.type === 'ssh-key') {
      data.username = credentialForm.username;
      data.privateKey = credentialForm.privateKey;
      data.passphrase = credentialForm.passphrase;
    } else if (credentialForm.type === 'access-token') {
      data.token = credentialForm.token;
    } else if (credentialForm.type === 'kubeconfig') {
      data.kubeconfig = credentialForm.kubeconfig;
    }
    await createCredential(projectId.value, data);
    message.success('凭证创建成功');
    credentialModalVisible.value = false;
    fetchCredentials();
  } catch (e: any) {
    message.error('创建凭证失败: ' + e.message);
  } finally {
    credentialSubmitting.value = false;
  }
}

async function handleDeleteCredential(record: any) {
  try {
    await deleteCredential(projectId.value, record.id);
    message.success('删除成功');
    fetchCredentials();
  } catch (e: any) {
    message.error('删除失败: ' + e.message);
  }
}

// ====== Tab 3: Settings ======
const editMode = ref(false);
const settingsSubmitting = ref(false);
const testingConnection = ref(false);
const settingsForm = reactive<Record<string, any>>({
  name: '',
  description: '',
  jenkinsUrl: '',
  jenkinsUser: '',
  jenkinsToken: '',
});

function enterEditMode() {
  settingsForm.name = project.value?.name || '';
  settingsForm.description = project.value?.description || '';
  settingsForm.jenkinsUrl = project.value?.jenkinsUrl || '';
  settingsForm.jenkinsUser = project.value?.jenkinsUser || '';
  settingsForm.jenkinsToken = project.value?.jenkinsToken || '';
  editMode.value = true;
}

function cancelEditMode() {
  editMode.value = false;
}

async function handleTestConnection() {
  testingConnection.value = true;
  try {
    await testJenkinsConnection(projectId.value);
    message.success('Jenkins 连接测试成功');
  } catch (e: any) {
    message.error('Jenkins 连接测试失败: ' + e.message);
  } finally {
    testingConnection.value = false;
  }
}

async function handleSaveSettings() {
  if (!settingsForm.name) {
    message.warning('请输入工程名称');
    return;
  }
  settingsSubmitting.value = true;
  try {
    await updateDevopsProject(projectId.value, { ...settingsForm });
    message.success('保存成功');
    editMode.value = false;
    fetchProject();
  } catch (e: any) {
    message.error('保存失败: ' + e.message);
  } finally {
    settingsSubmitting.value = false;
  }
}

function handleDeleteProject() {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除工程 "${project.value?.name}" 吗？此操作不可恢复。`,
    okType: 'danger',
    okText: '删除',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteDevopsProject(projectId.value);
        message.success('工程已删除');
        router.push('/K8S/devops/projects');
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

// ====== Init ======
async function fetchProject() {
  loading.value = true;
  try {
    const res = await getDevopsProject(projectId.value);
    project.value = res;
  } catch (e: any) {
    message.error('获取工程详情失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleTabChange(key: string) {
  activeTab.value = key;
  if (key === 'pipelines') {
    fetchPipelines();
  } else if (key === 'credentials') {
    fetchCredentials();
  }
}

function goBack() {
  router.push('/K8S/devops/projects');
}

onMounted(async () => {
  await fetchProject();
  fetchPipelines();
});
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- Header -->
      <Card class="mb-4">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="margin: 0; font-size: 22px;">
              {{ project?.name || '加载中...' }}
              <Tag
                v-if="project?.status"
                :color="project.status === 'active' ? 'green' : project.status === 'error' ? 'red' : 'default'"
                style="margin-left: 8px; vertical-align: middle;"
              >
                {{ project.status === 'active' ? '运行中' : project.status }}
              </Tag>
            </h2>
            <div style="color: #8c8c8c; margin-top: 4px;">
              {{ project?.description || '' }}
            </div>
          </div>
          <Space>
            <Button @click="fetchProject">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <!-- Tabs -->
      <Card>
        <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
          <!-- Tab 1: Pipelines -->
          <TabPane key="pipelines" tab="流水线">
            <div style="margin-bottom: 16px;">
              <Button type="primary" @click="goCreatePipeline">创建流水线</Button>
            </div>
            <Table
              :columns="pipelineColumns"
              :data-source="pipelines"
              :loading="pipelinesLoading"
              :pagination="{ pageSize: 10 }"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a @click="goPipelineDetail(record)">{{ record.name }}</a>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="statusColorMap[record.status] || 'default'">
                    {{ record.status }}
                  </Tag>
                </template>
                <template v-if="column.key === 'lastRunStatus'">
                  <StagePipeline
                    v-if="pipelineStagesMap[record.id]?.length"
                    :stages="pipelineStagesMap[record.id]"
                    size="mini"
                  />
                  <Tag
                    v-else-if="record.lastRunStatus"
                    :color="runStatusColorMap[record.lastRunStatus] || 'default'"
                  >
                    {{ record.lastRunStatus }}
                  </Tag>
                  <span v-else style="color: #8c8c8c;">-</span>
                </template>
                <template v-if="column.key === 'action'">
                  <Space>
                    <Button type="link" size="small" @click="handleRunPipeline(record)">
                      运行
                    </Button>
                    <Popconfirm
                      title="确定要删除该流水线吗？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="handleDeletePipeline(record)"
                    >
                      <Button type="link" danger size="small">删除</Button>
                    </Popconfirm>
                  </Space>
                </template>
              </template>
            </Table>
          </TabPane>

          <!-- Tab 2: Credentials -->
          <TabPane key="credentials" tab="凭证">
            <div style="margin-bottom: 16px;">
              <Button type="primary" @click="openCredentialModal">创建凭证</Button>
            </div>
            <Table
              :columns="credentialColumns"
              :data-source="credentials"
              :loading="credentialsLoading"
              :pagination="{ pageSize: 10 }"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag color="blue">
                    {{ credentialTypeLabels[record.type] || record.type }}
                  </Tag>
                </template>
                <template v-if="column.key === 'action'">
                  <Popconfirm
                    title="确定要删除该凭证吗？"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="handleDeleteCredential(record)"
                  >
                    <Button type="link" danger size="small">删除</Button>
                  </Popconfirm>
                </template>
              </template>
            </Table>

            <!-- Create Credential Modal -->
            <Modal
              v-model:open="credentialModalVisible"
              title="创建凭证"
              :confirm-loading="credentialSubmitting"
              ok-text="创建"
              cancel-text="取消"
              @ok="handleCreateCredential"
            >
              <Form layout="vertical" style="margin-top: 16px;">
                <FormItem label="名称" required>
                  <Input v-model:value="credentialForm.name" placeholder="请输入凭证名称" />
                </FormItem>
                <FormItem label="类型">
                  <Select v-model:value="credentialForm.type" style="width: 100%;">
                    <SelectOption value="username-password">用户名/密码</SelectOption>
                    <SelectOption value="ssh-key">SSH 密钥</SelectOption>
                    <SelectOption value="access-token">访问令牌</SelectOption>
                    <SelectOption value="kubeconfig">Kubeconfig</SelectOption>
                  </Select>
                </FormItem>
                <FormItem label="描述">
                  <Input v-model:value="credentialForm.description" placeholder="请输入描述" />
                </FormItem>

                <!-- Dynamic fields: username-password -->
                <template v-if="credentialForm.type === 'username-password'">
                  <FormItem label="用户名">
                    <Input v-model:value="credentialForm.username" placeholder="请输入用户名" />
                  </FormItem>
                  <FormItem label="密码">
                    <InputPassword
                      v-model:value="credentialForm.password"
                      placeholder="请输入密码"
                    />
                  </FormItem>
                </template>

                <!-- Dynamic fields: ssh-key -->
                <template v-if="credentialForm.type === 'ssh-key'">
                  <FormItem label="用户名">
                    <Input v-model:value="credentialForm.username" placeholder="请输入用户名" />
                  </FormItem>
                  <FormItem label="私钥">
                    <Input.TextArea
                      v-model:value="credentialForm.privateKey"
                      placeholder="请粘贴 SSH 私钥"
                      :rows="6"
                    />
                  </FormItem>
                  <FormItem label="密码短语">
                    <InputPassword
                      v-model:value="credentialForm.passphrase"
                      placeholder="请输入密码短语（可选）"
                    />
                  </FormItem>
                </template>

                <!-- Dynamic fields: access-token -->
                <template v-if="credentialForm.type === 'access-token'">
                  <FormItem label="令牌">
                    <InputPassword
                      v-model:value="credentialForm.token"
                      placeholder="请输入访问令牌"
                    />
                  </FormItem>
                </template>

                <!-- Dynamic fields: kubeconfig -->
                <template v-if="credentialForm.type === 'kubeconfig'">
                  <FormItem label="Kubeconfig">
                    <Input.TextArea
                      v-model:value="credentialForm.kubeconfig"
                      placeholder="请粘贴 Kubeconfig 内容"
                      :rows="8"
                    />
                  </FormItem>
                </template>
              </Form>
            </Modal>
          </TabPane>

          <!-- Tab 3: Settings -->
          <TabPane key="settings" tab="设置">
            <!-- View mode -->
            <template v-if="!editMode">
              <Descriptions bordered :column="2" size="small">
                <DescriptionsItem label="工程名称">
                  {{ project?.name || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="描述">
                  {{ project?.description || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="Jenkins URL">
                  {{ project?.jenkinsUrl || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="Jenkins 用户">
                  {{ project?.jenkinsUser || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="Jenkins Token">
                  {{ project?.jenkinsToken ? '******' : '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="创建时间">
                  {{ project?.createdAt || '-' }}
                </DescriptionsItem>
              </Descriptions>
              <div style="margin-top: 16px;">
                <Button type="primary" @click="enterEditMode">编辑</Button>
              </div>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <Form layout="vertical" style="max-width: 600px;">
                <FormItem label="工程名称" required>
                  <Input v-model:value="settingsForm.name" placeholder="请输入工程名称" />
                </FormItem>
                <FormItem label="描述">
                  <Input v-model:value="settingsForm.description" placeholder="请输入描述" />
                </FormItem>
                <FormItem label="Jenkins URL">
                  <Input
                    v-model:value="settingsForm.jenkinsUrl"
                    placeholder="例如: http://jenkins.example.com"
                  />
                </FormItem>
                <FormItem label="Jenkins 用户">
                  <Input
                    v-model:value="settingsForm.jenkinsUser"
                    placeholder="请输入 Jenkins 用户名"
                  />
                </FormItem>
                <FormItem label="Jenkins Token">
                  <InputPassword
                    v-model:value="settingsForm.jenkinsToken"
                    placeholder="请输入 Jenkins API Token"
                  />
                </FormItem>
                <FormItem>
                  <Space>
                    <Button
                      :loading="testingConnection"
                      @click="handleTestConnection"
                    >
                      测试连接
                    </Button>
                    <Button
                      type="primary"
                      :loading="settingsSubmitting"
                      @click="handleSaveSettings"
                    >
                      保存
                    </Button>
                    <Button @click="cancelEditMode">取消</Button>
                  </Space>
                </FormItem>
              </Form>
            </template>

            <!-- Delete project -->
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f0f0f0;">
              <h3 style="color: #ff4d4f; margin-bottom: 8px;">危险操作</h3>
              <p style="color: #8c8c8c; margin-bottom: 16px;">
                删除工程后，关联的所有流水线和凭证数据将被永久清除，此操作不可恢复。
              </p>
              <Button danger type="primary" @click="handleDeleteProject">删除工程</Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  </div>
</template>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
