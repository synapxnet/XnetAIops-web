<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Row,
  Col,
  Input,
  Empty,
  Spin,
} from 'ant-design-vue';
import {
  getDevopsProjects,
  createDevopsProject,
  deleteDevopsProject,
} from '../api/devops';

const router = useRouter();
const loading = ref(false);
const projects = ref<any[]>([]);
const searchText = ref('');

// Create modal state
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = ref({
  name: '',
  description: '',
  jenkinsUrl: '',
  jenkinsUser: '',
  jenkinsToken: '',
  clusterId: undefined as number | undefined,
});

const statusColorMap: Record<string, string> = {
  active: 'green',
  error: 'red',
  inactive: 'default',
  connecting: 'blue',
};
const statusLabelMap: Record<string, string> = {
  active: '运行中',
  error: '异常',
  inactive: '未启用',
  connecting: '连接中',
};

const filteredProjects = computed(() => {
  if (!searchText.value) return projects.value;
  const kw = searchText.value.toLowerCase();
  return projects.value.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(kw) ||
      (p.description || '').toLowerCase().includes(kw),
  );
});

async function fetchProjects() {
  loading.value = true;
  try {
    const res = await getDevopsProjects();
    projects.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取 DevOps 工程列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goDetail(record: any) {
  router.push(`/K8S/devops/projects/${record.id}`);
}

function handleDelete(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除工程「${record.name}」吗？删除后将无法恢复，关联的流水线和凭证也将一并删除。`,
    okType: 'danger',
    okText: '删除',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteDevopsProject(record.id);
        message.success('删除成功');
        fetchProjects();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

function openCreate() {
  createForm.value = {
    name: '',
    description: '',
    jenkinsUrl: '',
    jenkinsUser: '',
    jenkinsToken: '',
    clusterId: undefined,
  };
  createVisible.value = true;
}

async function handleCreate() {
  if (!createForm.value.name.trim()) {
    message.warning('请输入工程名称');
    return;
  }
  if (!createForm.value.jenkinsUrl.trim()) {
    message.warning('请输入 Jenkins URL');
    return;
  }
  if (!createForm.value.jenkinsUser.trim()) {
    message.warning('请输入 Jenkins 用户名');
    return;
  }
  if (!createForm.value.jenkinsToken.trim()) {
    message.warning('请输入 Jenkins Token');
    return;
  }
  createLoading.value = true;
  try {
    const payload: any = {
      name: createForm.value.name.trim(),
      description: createForm.value.description.trim(),
      jenkinsUrl: createForm.value.jenkinsUrl.trim(),
      jenkinsUser: createForm.value.jenkinsUser.trim(),
      jenkinsToken: createForm.value.jenkinsToken.trim(),
    };
    if (createForm.value.clusterId !== undefined && createForm.value.clusterId !== null) {
      payload.clusterId = createForm.value.clusterId;
    }
    await createDevopsProject(payload);
    message.success('创建成功');
    createVisible.value = false;
    fetchProjects();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    createLoading.value = false;
  }
}

function formatTime(val: string) {
  if (!val) return '-';
  return val.replace('T', ' ').substring(0, 19);
}

onMounted(fetchProjects);
</script>

<template>
  <div class="p-4">
    <!-- Banner -->
    <div class="devops-banner">
      <h1 class="devops-banner-title">DevOps 工程</h1>
      <p class="devops-banner-desc">
        基于 Jenkins 的持续集成与持续部署平台，管理流水线、凭证和自动化构建
      </p>
    </div>

    <!-- Toolbar -->
    <Card class="mb-4">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <Space>
          <Input.Search
            v-model:value="searchText"
            placeholder="搜索工程名称/描述"
            style="width: 280px;"
            allow-clear
          />
        </Space>
        <Space>
          <Button @click="fetchProjects" :loading="loading">刷新</Button>
          <Button type="primary" @click="openCreate">创建工程</Button>
        </Space>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="loading" style="text-align: center; padding: 80px 0;">
      <Spin size="large" tip="加载中..." />
    </div>

    <!-- Project Grid -->
    <template v-else-if="filteredProjects.length > 0">
      <Row :gutter="[16, 16]">
        <Col :span="8" v-for="project in filteredProjects" :key="project.id">
          <Card hoverable class="project-card" @click="goDetail(project)">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div style="flex: 1; overflow: hidden;">
                <div class="project-name">{{ project.name }}</div>
                <div class="project-desc">{{ project.description || '暂无描述' }}</div>
              </div>
              <Tag :color="statusColorMap[project.status] || 'default'" style="flex-shrink: 0; margin-left: 8px;">
                {{ statusLabelMap[project.status] || project.status || '未知' }}
              </Tag>
            </div>

            <!-- Metrics -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div class="card-metric">
                <div class="card-metric-label">Jenkins URL</div>
                <div class="card-metric-value" style="font-size: 12px;">
                  <Tag v-if="project.jenkinsUrl" color="blue" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">
                    {{ project.jenkinsUrl }}
                  </Tag>
                  <span v-else style="color: #bfbfbf;">未配置</span>
                </div>
              </div>
              <div class="card-metric">
                <div class="card-metric-label">流水线数量</div>
                <div class="card-metric-value">
                  <span style="font-size: 20px; font-weight: 600; color: #1890ff;">{{ project.pipelineCount ?? 0 }}</span>
                  <span style="font-size: 12px; color: #8c8c8c; margin-left: 4px;">条</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid hsl(var(--border)); padding-top: 8px;">
              <span style="font-size: 12px; color: #8c8c8c;">{{ formatTime(project.createdAt) }}</span>
              <Space>
                <Button type="link" size="small" @click.stop="goDetail(project)">管理</Button>
                <Button type="link" size="small" danger @click.stop="handleDelete(project)">删除</Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <Empty description="暂无 DevOps 工程">
        <Button type="primary" @click="openCreate">创建工程</Button>
      </Empty>
    </div>

    <!-- Create Modal -->
    <Modal
      v-model:open="createVisible"
      title="创建 DevOps 工程"
      :confirm-loading="createLoading"
      ok-text="创建"
      cancel-text="取消"
      @ok="handleCreate"
      :width="560"
    >
      <div style="padding: 16px 0;">
        <div class="form-item">
          <label class="form-label">
            <span style="color: #ff4d4f;">*</span> 工程名称
          </label>
          <Input
            v-model:value="createForm.name"
            placeholder="请输入工程名称"
            :maxlength="64"
          />
        </div>
        <div class="form-item">
          <label class="form-label">描述</label>
          <Input.TextArea
            v-model:value="createForm.description"
            placeholder="请输入工程描述（可选）"
            :rows="2"
            :maxlength="256"
          />
        </div>
        <div class="form-item">
          <label class="form-label">
            <span style="color: #ff4d4f;">*</span> Jenkins URL
          </label>
          <Input
            v-model:value="createForm.jenkinsUrl"
            placeholder="例如: http://192.168.1.100:8080"
          />
        </div>
        <div class="form-item">
          <label class="form-label">
            <span style="color: #ff4d4f;">*</span> Jenkins 用户名
          </label>
          <Input
            v-model:value="createForm.jenkinsUser"
            placeholder="请输入 Jenkins 用户名"
          />
        </div>
        <div class="form-item">
          <label class="form-label">
            <span style="color: #ff4d4f;">*</span> Jenkins Token
          </label>
          <Input.Password
            v-model:value="createForm.jenkinsToken"
            placeholder="请输入 Jenkins API Token"
          />
        </div>
        <div class="form-item">
          <label class="form-label">关联集群 ID</label>
          <Input
            v-model:value="createForm.clusterId"
            placeholder="关联 K8s 集群 ID（可选）"
            type="number"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.devops-banner {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 8px;
  padding: 40px 32px;
  margin-bottom: 24px;
  color: #fff;
}

.devops-banner-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.devops-banner-desc {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.project-card {
  cursor: pointer;
  transition: all 0.2s;
  height: 100%;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #262626;
}

.project-desc {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 18px;
}

.card-metric {
  padding: 4px 0;
}

.card-metric-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.card-metric-value {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  background: hsl(var(--card));
  border-radius: 8px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: hsl(var(--foreground));
  margin-bottom: 6px;
  font-weight: 500;
}
</style>
