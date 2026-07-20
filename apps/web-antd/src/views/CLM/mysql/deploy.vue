<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  Button,
  Steps,
  Step,
  Row,
  Col,
  Divider,
  Alert,
  Space,
  message,
} from 'ant-design-vue';
import {
  createMySQLInstance,
  testMySQLConnection,
  deployMySQLInstance,
  previewMySQLScript,
} from '../api/mysqlInstance';
import type { MySQLDeployConfig } from '../api/types';

const router = useRouter();
const currentStep = ref(0);
const testing = ref(false);
const deploying = ref(false);
const testResult = ref<{ success: boolean; message: string; systemInfo?: string } | null>(null);
const deployScript = ref('');

const formState = reactive({
  // SSH
  instanceName: '',
  host: '',
  sshPort: 22,
  sshUser: 'root',
  authType: 'password',
  encryptedPassword: '',
  // MySQL
  mysqlVersion: '8.0',
  mysqlPort: 3306,
  dataDir: '/var/lib/mysql',
  rootPassword: '',
  charset: 'utf8mb4',
  innodbBufferPoolSize: 1024,
  maxConnections: 500,
  // 复制
  role: 'standalone',
  serverId: 1,
  masterHost: '',
  masterPort: 3306,
  replUser: 'repl',
  replPassword: '',
  description: '',
});

const canDeploy = computed(() => {
  return (
    formState.instanceName &&
    formState.host &&
    formState.rootPassword &&
    testResult.value?.success
  );
});

async function handleTestConnection() {
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testMySQLConnection({
      host: formState.host,
      sshPort: formState.sshPort,
      sshUser: formState.sshUser,
      authType: formState.authType,
      encryptedPassword: formState.encryptedPassword,
    });
    testResult.value = res as any;
    if ((res as any)?.success) {
      message.success('SSH连接成功');
    } else {
      message.error((res as any)?.message || '连接失败');
    }
  } catch (e: any) {
    testResult.value = { success: false, message: e.message };
    message.error('连接测试失败: ' + e.message);
  } finally {
    testing.value = false;
  }
}

async function handlePreviewScript() {
  try {
    const config: MySQLDeployConfig = {
      mysqlVersion: formState.mysqlVersion,
      mysqlPort: formState.mysqlPort,
      dataDir: formState.dataDir,
      rootPassword: formState.rootPassword,
      charset: formState.charset,
      innodbBufferPoolSize: formState.innodbBufferPoolSize,
      maxConnections: formState.maxConnections,
      role: formState.role,
      serverId: formState.serverId,
      masterHost: formState.masterHost || undefined,
      masterPort: formState.masterPort || undefined,
      replUser: formState.replUser || undefined,
      replPassword: formState.replPassword || undefined,
    };
    const res = await previewMySQLScript(config);
    deployScript.value = (res as any)?.script || '';
  } catch (e: any) {
    message.error('预览脚本失败: ' + e.message);
  }
}

async function handleDeploy() {
  deploying.value = true;
  try {
    // Step 1: Create instance record
    const instance = await createMySQLInstance({
      instanceName: formState.instanceName,
      host: formState.host,
      sshPort: formState.sshPort,
      sshUser: formState.sshUser,
      authType: formState.authType,
      encryptedPassword: formState.encryptedPassword,
      mysqlPort: formState.mysqlPort,
      mysqlVersion: formState.mysqlVersion,
      dataDir: formState.dataDir,
      charset: formState.charset,
      innodbBufferPoolSize: formState.innodbBufferPoolSize,
      maxConnections: formState.maxConnections,
      role: formState.role,
      serverId: formState.serverId,
      description: formState.description,
    });

    const instanceId = (instance as any)?.id;
    if (!instanceId) {
      message.error('创建实例记录失败');
      return;
    }

    // Step 2: Trigger deploy
    const config: MySQLDeployConfig = {
      mysqlVersion: formState.mysqlVersion,
      mysqlPort: formState.mysqlPort,
      dataDir: formState.dataDir,
      rootPassword: formState.rootPassword,
      charset: formState.charset,
      innodbBufferPoolSize: formState.innodbBufferPoolSize,
      maxConnections: formState.maxConnections,
      role: formState.role,
      serverId: formState.serverId,
      masterHost: formState.masterHost || undefined,
      masterPort: formState.masterPort || undefined,
      replUser: formState.replUser || undefined,
      replPassword: formState.replPassword || undefined,
    };

    await deployMySQLInstance(instanceId, config);
    message.success('部署任务已提交，请在列表页查看进度');
    router.push('/CLM/mysql/list');
  } catch (e: any) {
    message.error('部署失败: ' + e.message);
  } finally {
    deploying.value = false;
  }
}

function nextStep() {
  currentStep.value++;
  if (currentStep.value === 2) {
    handlePreviewScript();
  }
}

function prevStep() {
  currentStep.value--;
}

function goBack() {
  router.push('/CLM/mysql/list');
}
</script>

<template>
  <div class="p-4">
    <Card title="部署 MySQL 实例">
      <template #extra>
        <Button @click="goBack">返回列表</Button>
      </template>

      <Steps :current="currentStep" class="mb-6">
        <Step title="SSH 连接" description="配置目标主机" />
        <Step title="MySQL 配置" description="数据库参数" />
        <Step title="确认部署" description="预览并执行" />
      </Steps>

      <Divider />

      <!-- Step 0: SSH -->
      <div v-show="currentStep === 0">
        <Form layout="vertical" :model="formState" style="max-width: 600px">
          <FormItem label="实例名称" required>
            <Input v-model:value="formState.instanceName" placeholder="例如: mysql-prod-01" />
          </FormItem>
          <Row :gutter="16">
            <Col :span="16">
              <FormItem label="主机地址" required>
                <Input v-model:value="formState.host" placeholder="127.0.0.1" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="SSH端口">
                <InputNumber v-model:value="formState.sshPort" :min="1" :max="65535" style="width: 100%" />
              </FormItem>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="SSH用户名">
                <Input v-model:value="formState.sshUser" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="SSH密码">
                <Input.Password v-model:value="formState.encryptedPassword" />
              </FormItem>
            </Col>
          </Row>
          <FormItem label="描述">
            <Input.TextArea v-model:value="formState.description" :rows="2" />
          </FormItem>
          <FormItem>
            <Space>
              <Button :loading="testing" @click="handleTestConnection">测试连接</Button>
              <Button type="primary" :disabled="!testResult?.success" @click="nextStep">下一步</Button>
            </Space>
          </FormItem>
        </Form>

        <Alert
          v-if="testResult"
          :type="testResult.success ? 'success' : 'error'"
          :message="testResult.message"
          :description="testResult.systemInfo"
          show-icon
          class="mt-4"
          style="max-width: 600px"
        />
      </div>

      <!-- Step 1: MySQL Config -->
      <div v-show="currentStep === 1">
        <Form layout="vertical" :model="formState" style="max-width: 600px">
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="MySQL 版本">
                <Select v-model:value="formState.mysqlVersion">
                  <Select.Option value="8.0">MySQL 8.0</Select.Option>
                  <Select.Option value="5.7">MySQL 5.7</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="MySQL 端口">
                <InputNumber v-model:value="formState.mysqlPort" :min="1" :max="65535" style="width: 100%" />
              </FormItem>
            </Col>
          </Row>
          <FormItem label="Root 密码" required>
            <Input.Password v-model:value="formState.rootPassword" placeholder="设置root密码" />
          </FormItem>
          <FormItem label="数据目录">
            <Input v-model:value="formState.dataDir" />
          </FormItem>
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="字符集">
                <Select v-model:value="formState.charset">
                  <Select.Option value="utf8mb4">utf8mb4</Select.Option>
                  <Select.Option value="utf8">utf8</Select.Option>
                  <Select.Option value="latin1">latin1</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="InnoDB缓冲池(MB)">
                <InputNumber v-model:value="formState.innodbBufferPoolSize" :min="128" :step="256" style="width: 100%" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="最大连接数">
                <InputNumber v-model:value="formState.maxConnections" :min="10" :step="100" style="width: 100%" />
              </FormItem>
            </Col>
          </Row>

          <Divider>主从复制</Divider>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="角色">
                <Select v-model:value="formState.role">
                  <Select.Option value="standalone">独立</Select.Option>
                  <Select.Option value="master">主节点</Select.Option>
                  <Select.Option value="slave">从节点</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="Server ID">
                <InputNumber v-model:value="formState.serverId" :min="1" style="width: 100%" />
              </FormItem>
            </Col>
          </Row>
          <template v-if="formState.role === 'slave'">
            <Row :gutter="16">
              <Col :span="16">
                <FormItem label="主节点地址">
                  <Input v-model:value="formState.masterHost" />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="主节点端口">
                  <InputNumber v-model:value="formState.masterPort" style="width: 100%" />
                </FormItem>
              </Col>
            </Row>
          </template>
          <template v-if="formState.role === 'master' || formState.role === 'slave'">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="复制用户名">
                  <Input v-model:value="formState.replUser" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="复制密码">
                  <Input.Password v-model:value="formState.replPassword" />
                </FormItem>
              </Col>
            </Row>
          </template>

          <FormItem>
            <Space>
              <Button @click="prevStep">上一步</Button>
              <Button type="primary" @click="nextStep">下一步</Button>
            </Space>
          </FormItem>
        </Form>
      </div>

      <!-- Step 2: Confirm -->
      <div v-show="currentStep === 2">
        <Alert type="info" message="部署预览" description="请确认以下配置无误后点击「开始部署」" show-icon class="mb-4" />
        <Row :gutter="16" class="mb-4">
          <Col :span="8"><strong>实例名称:</strong> {{ formState.instanceName }}</Col>
          <Col :span="8"><strong>主机:</strong> {{ formState.host }}:{{ formState.sshPort }}</Col>
          <Col :span="8"><strong>MySQL版本:</strong> {{ formState.mysqlVersion }}</Col>
        </Row>
        <Row :gutter="16" class="mb-4">
          <Col :span="8"><strong>端口:</strong> {{ formState.mysqlPort }}</Col>
          <Col :span="8"><strong>角色:</strong> {{ formState.role }}</Col>
          <Col :span="8"><strong>缓冲池:</strong> {{ formState.innodbBufferPoolSize }}MB</Col>
        </Row>

        <Divider>部署脚本预览</Divider>
        <pre style="max-height: 400px; overflow: auto; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; font-size: 13px; line-height: 1.5">{{ deployScript || '加载中...' }}</pre>

        <div class="mt-4">
          <Space>
            <Button @click="prevStep">上一步</Button>
            <Button type="primary" :loading="deploying" @click="handleDeploy">开始部署</Button>
          </Space>
        </div>
      </div>
    </Card>
  </div>
</template>
