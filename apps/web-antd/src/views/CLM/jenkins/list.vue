<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Table, Button, Space, Tag, Modal, Input, Select,
  Row, Col, Statistic, message, Tooltip, Tabs, Popconfirm,
} from 'ant-design-vue';
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined,
  PlayCircleOutlined, PauseCircleOutlined, EyeOutlined,
  CloudServerOutlined, ClusterOutlined, SearchOutlined,
  KeyOutlined, UndoOutlined, PoweroffOutlined,
} from '@ant-design/icons-vue';
import {
  getJenkinsMasters, deleteJenkinsMaster, checkJenkinsMasterStatus,
  startJenkins, stopJenkins, restartJenkins, uninstallJenkins, getInitialPassword,
  getStatusText, getStatusColor,
} from '../api/jenkinsMaster';
import {
  getJenkinsNodes, deleteJenkinsNode, checkJenkinsNodeStatus,
  startAgent, stopAgent,
  getStatusText as getNodeStatusText, getStatusColor as getNodeStatusColor,
} from '../api/jenkinsNode';
import type { JenkinsMaster, JenkinsNode } from '../api/types';

const router = useRouter();

// Tab切换
const activeTab = ref('master');

// Master数据
const masterList = ref<JenkinsMaster[]>([]);
const masterLoading = ref(false);
const masterSearchText = ref('');
const masterStatusFilter = ref<string | undefined>(undefined);

// Node数据
const nodeList = ref<JenkinsNode[]>([]);
const nodeLoading = ref(false);
const nodeSearchText = ref('');
const nodeStatusFilter = ref<string | undefined>(undefined);

// 日志弹窗
const logModalVisible = ref(false);
const currentLog = ref('');
const currentLogTitle = ref('');

// 密码弹窗
const passwordModalVisible = ref(false);
const initialPasswordText = ref('');

// 自动刷新
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ==================== Master表格列 ====================

const masterColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '主机', dataIndex: 'host', key: 'host', width: 150 },
  { title: 'Jenkins端口', dataIndex: 'jenkins_port', key: 'jenkins_port', width: 100 },
  { title: '版本', dataIndex: 'jenkins_version', key: 'jenkins_version', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
  { title: '操作', key: 'action', width: 300, fixed: 'right' as const },
];

// ==================== Node表格列 ====================

const nodeColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '主机', dataIndex: 'host', key: 'host', width: 150 },
  { title: '操作系统', dataIndex: 'os_type', key: 'os_type', width: 80 },
  { title: 'CPU', dataIndex: 'cpu_cores', key: 'cpu_cores', width: 60 },
  { title: '内存(GB)', dataIndex: 'ram_gb', key: 'ram_gb', width: 80 },
  { title: '标签', dataIndex: 'labels', key: 'labels', width: 120, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 260, fixed: 'right' as const },
];

// ==================== 过滤 ====================

const filteredMasterList = computed(() => {
  return masterList.value.filter((item) => {
    const matchSearch = !masterSearchText.value ||
      item.name?.toLowerCase().includes(masterSearchText.value.toLowerCase()) ||
      item.host?.toLowerCase().includes(masterSearchText.value.toLowerCase());
    const matchStatus = !masterStatusFilter.value || item.status === masterStatusFilter.value;
    return matchSearch && matchStatus;
  });
});

const filteredNodeList = computed(() => {
  return nodeList.value.filter((item) => {
    const matchSearch = !nodeSearchText.value ||
      item.name?.toLowerCase().includes(nodeSearchText.value.toLowerCase()) ||
      item.host?.toLowerCase().includes(nodeSearchText.value.toLowerCase());
    const matchStatus = !nodeStatusFilter.value || item.status === nodeStatusFilter.value;
    return matchSearch && matchStatus;
  });
});

// ==================== 统计 ====================

const masterStats = computed(() => ({
  total: masterList.value.length,
  running: masterList.value.filter((m) => m.status === 'running' || m.status === 'deployed').length,
  stopped: masterList.value.filter((m) => m.status === 'stopped').length,
  failed: masterList.value.filter((m) => m.status === 'failed').length,
}));

const nodeStats = computed(() => ({
  total: nodeList.value.length,
  running: nodeList.value.filter((n) => n.status === 'running').length,
  stopped: nodeList.value.filter((n) => n.status === 'stopped').length,
  failed: nodeList.value.filter((n) => n.status === 'failed').length,
}));

// ==================== 数据加载 ====================

const loadMasters = async () => {
  masterLoading.value = true;
  try {
    const res = await getJenkinsMasters();
    masterList.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (error: any) {
    console.error('加载Master列表失败:', error);
    message.error('加载Master列表失败');
  } finally {
    masterLoading.value = false;
  }
};

const loadNodes = async () => {
  nodeLoading.value = true;
  try {
    const res = await getJenkinsNodes();
    nodeList.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (error: any) {
    console.error('加载Node列表失败:', error);
    message.error('加载Node列表失败');
  } finally {
    nodeLoading.value = false;
  }
};

// ==================== 导航 ====================

function goDeployMaster() { router.push('/CLM/jenkins/deploy?type=master'); }
function goDeployNode() { router.push('/CLM/jenkins/deploy?type=node'); }

// ==================== Master操作 ====================

const handleRefreshMasterStatus = async (record: JenkinsMaster) => {
  try {
    await checkJenkinsMasterStatus(record.id!);
    message.success('状态已刷新');
    loadMasters();
  } catch (e: any) { message.error('刷新状态失败: ' + e.message); }
};

const handleMasterStart = async (record: JenkinsMaster) => {
  try {
    await startJenkins(record.id!);
    message.success('启动命令已发送');
    setTimeout(loadMasters, 2000);
  } catch (e: any) { message.error('启动失败: ' + e.message); }
};

const handleMasterStop = async (record: JenkinsMaster) => {
  try {
    await stopJenkins(record.id!);
    message.success('停止命令已发送');
    setTimeout(loadMasters, 2000);
  } catch (e: any) { message.error('停止失败: ' + e.message); }
};

const handleMasterRestart = async (record: JenkinsMaster) => {
  try {
    await restartJenkins(record.id!);
    message.success('重启命令已发送');
    setTimeout(loadMasters, 2000);
  } catch (e: any) { message.error('重启失败: ' + e.message); }
};

const handleGetPassword = async (record: JenkinsMaster) => {
  try {
    const res = await getInitialPassword(record.id!) as any;
    initialPasswordText.value = res?.data || res || record.initial_password || '未获取到';
    passwordModalVisible.value = true;
  } catch (e: any) { message.error('获取密码失败: ' + e.message); }
};

const handleViewMasterLog = (record: JenkinsMaster) => {
  currentLogTitle.value = `部署日志 - ${record.name}`;
  currentLog.value = record.deploy_log || '暂无日志';
  logModalVisible.value = true;
};

const handleDeleteMaster = async (id: number) => {
  try {
    await deleteJenkinsMaster(id);
    message.success('删除成功');
    loadMasters();
  } catch (e: any) { message.error('删除失败: ' + e.message); }
};

const handleMasterUninstall = async (record: JenkinsMaster) => {
  Modal.confirm({
    title: '确认卸载',
    content: `确定要卸载Jenkins Master「${record.name}」的Jenkins服务吗？此操作将清除远程服务。`,
    okType: 'danger',
    async onOk() {
      try {
        await uninstallJenkins(record.id!);
        message.success('卸载成功');
        loadMasters();
      } catch (e: any) { message.error('卸载失败: ' + e.message); }
    },
  });
};

// ==================== Node操作 ====================

const handleRefreshNodeStatus = async (record: JenkinsNode) => {
  try {
    await checkJenkinsNodeStatus(record.id!);
    message.success('状态已刷新');
    loadNodes();
  } catch (e: any) { message.error('刷新状态失败: ' + e.message); }
};

const handleNodeStart = async (record: JenkinsNode) => {
  try {
    await startAgent(record.id!);
    message.success('Agent启动命令已发送');
    setTimeout(loadNodes, 2000);
  } catch (e: any) { message.error('启动失败: ' + e.message); }
};

const handleNodeStop = async (record: JenkinsNode) => {
  try {
    await stopAgent(record.id!);
    message.success('已停止');
    setTimeout(loadNodes, 2000);
  } catch (e: any) { message.error('停止失败: ' + e.message); }
};

const handleViewNodeLog = (record: JenkinsNode) => {
  currentLogTitle.value = `部署日志 - ${record.name}`;
  currentLog.value = record.deploy_log || '暂无日志';
  logModalVisible.value = true;
};

const handleDeleteNode = async (id: number) => {
  try {
    await deleteJenkinsNode(id);
    message.success('删除成功');
    loadNodes();
  } catch (e: any) { message.error('删除失败: ' + e.message); }
};

// ==================== Tab切换 ====================

const handleTabChange = (key: string) => {
  activeTab.value = key;
  if (key === 'master') {
    loadMasters();
  } else {
    loadNodes();
  }
};

// ==================== 生命周期 ====================

onMounted(() => {
  loadMasters();
  loadNodes();
  // 30秒自动刷新
  refreshTimer = setInterval(() => {
    if (activeTab.value === 'master') {
      loadMasters();
    } else {
      loadNodes();
    }
  }, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="jenkins-container">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="stats-row">
      <Col :span="6">
        <Card>
          <Statistic title="Master总数" :value="masterStats.total" :value-style="{ color: '#1890ff' }">
            <template #prefix><CloudServerOutlined /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="Master运行中" :value="masterStats.running" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="Node总数" :value="nodeStats.total" :value-style="{ color: '#1890ff' }">
            <template #prefix><ClusterOutlined /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="Node运行中" :value="nodeStats.running" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
    </Row>

    <!-- 主内容区域 -->
    <Card class="main-card">
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- ====== Master Tab ====== -->
        <Tabs.TabPane key="master" tab="Jenkins Master">
          <div class="table-toolbar">
            <Space>
              <Input
                v-model:value="masterSearchText"
                placeholder="搜索名称或地址"
                style="width: 200px"
                allow-clear
              >
                <template #prefix><SearchOutlined /></template>
              </Input>
              <Select v-model:value="masterStatusFilter" placeholder="状态筛选" style="width: 120px" allow-clear>
                <Select.Option value="pending">待部署</Select.Option>
                <Select.Option value="deploying">部署中</Select.Option>
                <Select.Option value="deployed">已部署</Select.Option>
                <Select.Option value="running">运行中</Select.Option>
                <Select.Option value="stopped">已停止</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
              </Select>
            </Space>
            <Space>
              <Button @click="loadMasters">
                <template #icon><ReloadOutlined /></template>
                刷新
              </Button>
              <Button type="primary" @click="goDeployMaster">
                <template #icon><PlusOutlined /></template>
                部署Master
              </Button>
            </Space>
          </div>

          <Table
            :columns="masterColumns"
            :data-source="filteredMasterList"
            :loading="masterLoading"
            :row-key="(record: any) => record.id"
            :scroll="{ x: 1300 }"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space size="small">
                  <Tooltip title="刷新状态">
                    <Button size="small" @click="handleRefreshMasterStatus(record)">
                      <template #icon><ReloadOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Tooltip :title="record.status === 'running' ? '停止' : '启动'">
                    <Button
                      size="small"
                      :type="record.status === 'running' ? 'default' : 'primary'"
                      :disabled="record.status === 'deploying' || record.status === 'pending'"
                      @click="record.status === 'running' ? handleMasterStop(record) : handleMasterStart(record)"
                    >
                      <template #icon>
                        <PauseCircleOutlined v-if="record.status === 'running'" />
                        <PlayCircleOutlined v-else />
                      </template>
                    </Button>
                  </Tooltip>
                  <Tooltip v-if="record.status === 'running'" title="重启">
                    <Button size="small" @click="handleMasterRestart(record)">
                      <template #icon><UndoOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Tooltip title="初始密码">
                    <Button size="small" @click="handleGetPassword(record)">
                      <template #icon><KeyOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Tooltip title="查看日志">
                    <Button size="small" @click="handleViewMasterLog(record)">
                      <template #icon><EyeOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Tooltip v-if="record.status === 'deployed' || record.status === 'running'" title="卸载">
                    <Button size="small" danger @click="handleMasterUninstall(record)">
                      <template #icon><PoweroffOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Popconfirm title="确定要删除这个Master吗？" @confirm="handleDeleteMaster(record.id)">
                    <Button size="small" danger>
                      <template #icon><DeleteOutlined /></template>
                    </Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </Tabs.TabPane>

        <!-- ====== Node Tab ====== -->
        <Tabs.TabPane key="node" tab="Jenkins Node">
          <div class="table-toolbar">
            <Space>
              <Input
                v-model:value="nodeSearchText"
                placeholder="搜索名称或地址"
                style="width: 200px"
                allow-clear
              >
                <template #prefix><SearchOutlined /></template>
              </Input>
              <Select v-model:value="nodeStatusFilter" placeholder="状态筛选" style="width: 120px" allow-clear>
                <Select.Option value="pending">待部署</Select.Option>
                <Select.Option value="deploying">部署中</Select.Option>
                <Select.Option value="running">运行中</Select.Option>
                <Select.Option value="stopped">已停止</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
              </Select>
            </Space>
            <Space>
              <Button @click="loadNodes">
                <template #icon><ReloadOutlined /></template>
                刷新
              </Button>
              <Button type="primary" @click="goDeployNode">
                <template #icon><PlusOutlined /></template>
                部署Node
              </Button>
            </Space>
          </div>

          <Table
            :columns="nodeColumns"
            :data-source="filteredNodeList"
            :loading="nodeLoading"
            :row-key="(record: any) => record.id"
            :scroll="{ x: 1100 }"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="getNodeStatusColor(record.status)">
                  {{ getNodeStatusText(record.status) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space size="small">
                  <Tooltip title="刷新状态">
                    <Button size="small" @click="handleRefreshNodeStatus(record)">
                      <template #icon><ReloadOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Tooltip :title="record.status === 'running' ? '停止' : '启动'">
                    <Button
                      size="small"
                      :type="record.status === 'running' ? 'default' : 'primary'"
                      :disabled="record.status === 'deploying' || record.status === 'pending'"
                      @click="record.status === 'running' ? handleNodeStop(record) : handleNodeStart(record)"
                    >
                      <template #icon>
                        <PauseCircleOutlined v-if="record.status === 'running'" />
                        <PlayCircleOutlined v-else />
                      </template>
                    </Button>
                  </Tooltip>
                  <Tooltip title="查看日志">
                    <Button size="small" @click="handleViewNodeLog(record)">
                      <template #icon><EyeOutlined /></template>
                    </Button>
                  </Tooltip>
                  <Popconfirm title="确定要删除这个Node吗？" @confirm="handleDeleteNode(record.id)">
                    <Button size="small" danger>
                      <template #icon><DeleteOutlined /></template>
                    </Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <!-- 日志弹窗 -->
    <Modal v-model:open="logModalVisible" :title="currentLogTitle" width="800px" :footer="null">
      <pre class="log-content">{{ currentLog }}</pre>
    </Modal>

    <!-- 初始密码弹窗 -->
    <Modal v-model:open="passwordModalVisible" title="Jenkins 初始密码" :footer="null">
      <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 16px; text-align: center">
        {{ initialPasswordText }}
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.jenkins-container {
  padding: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.main-card {
  min-height: 500px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.log-content {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}
</style>
