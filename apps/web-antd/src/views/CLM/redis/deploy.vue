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
  createRedisInstance,
  testRedisConnection,
  deployRedisInstance,
  previewRedisScript,
} from '../api/redisInstance';
import type { RedisDeployConfig } from '../api/types';

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
  // Redis
  redisVersion: '7.2',
  redisPort: 6379,
  redisPassword: '',
  maxMemory: 1024,
  maxMemoryPolicy: 'noeviction',
  persistenceMode: 'rdb',
  dataDir: '/var/lib/redis',
  // 集群
  deployMode: 'standalone',
  role: 'master',
  masterHost: '',
  masterPort: 6379,
  masterPassword: '',
  sentinelMasterName: 'mymaster',
  sentinelQuorum: 2,
  description: '',
});

const canDeploy = computed(() => {
  return formState.instanceName && formState.host && testResult.value?.success;
});

async function handleTestConnection() {
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testRedisConnection({
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
    const config: RedisDeployConfig = {
      redisVersion: formState.redisVersion,
      redisPort: formState.redisPort,
      redisPassword: formState.redisPassword,
      maxMemory: formState.maxMemory,
      maxMemoryPolicy: formState.maxMemoryPolicy,
      persistenceMode: formState.persistenceMode,
      dataDir: formState.dataDir,
      deployMode: formState.deployMode,
      role: formState.role,
      masterHost: formState.masterHost || undefined,
      masterPort: formState.masterPort || undefined,
      masterPassword: formState.masterPassword || undefined,
      sentinelMasterName: formState.sentinelMasterName || undefined,
      sentinelQuorum: formState.sentinelQuorum || undefined,
    };
    const res = await previewRedisScript(config);
    deployScript.value = (res as any)?.script || '';
  } catch (e: any) {
    message.error('预览脚本失败: ' + e.message);
  }
}

async function handleDeploy() {
  deploying.value = true;
  try {
    const instance = await createRedisInstance({
      instanceName: formState.instanceName,
      host: formState.host,
      sshPort: formState.sshPort,
      sshUser: formState.sshUser,
      authType: formState.authType,
      encryptedPassword: formState.encryptedPassword,
      redisPort: formState.redisPort,
      redisVersion: formState.redisVersion,
      maxMemory: formState.maxMemory,
      maxMemoryPolicy: formState.maxMemoryPolicy,
      persistenceMode: formState.persistenceMode,
      dataDir: formState.dataDir,
      deployMode: formState.deployMode,
      role: formState.role,
      description: formState.description,
    });

    const instanceId = (instance as any)?.id;
    if (!instanceId) {
      message.error('创建实例记录失败');
      return;
    }

    const config: RedisDeployConfig = {
      redisVersion: formState.redisVersion,
      redisPort: formState.redisPort,
      redisPassword: formState.redisPassword,
      maxMemory: formState.maxMemory,
      maxMemoryPolicy: formState.maxMemoryPolicy,
      persistenceMode: formState.persistenceMode,
      dataDir: formState.dataDir,
      deployMode: formState.deployMode,
      role: formState.role,
      masterHost: formState.masterHost || undefined,
      masterPort: formState.masterPort || undefined,
      masterPassword: formState.masterPassword || undefined,
      sentinelMasterName: formState.sentinelMasterName || undefined,
      sentinelQuorum: formState.sentinelQuorum || undefined,
    };

    await deployRedisInstance(instanceId, config);
    message.success('部署任务已提交，请在列表页查看进度');
    router.push('/CLM/redis/list');
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
  router.push('/CLM/redis/list');
}
</script>

<template>
  <div class="p-4">
    <Card title="部署 Redis 实例">
      <template #extra>
        <Button @click="goBack">返回列表</Button>
      </template>

      <Steps :current="currentStep" class="mb-6">
        <Step title="SSH 连接" description="配置目标主机" />
        <Step title="Redis 配置" description="缓存参数" />
        <Step title="确认部署" description="预览并执行" />
      </Steps>

      <Divider />

      <!-- Step 0: SSH -->
      <div v-show="currentStep === 0">
        <Form layout="vertical" :model="formState" style="max-width: 600px">
          <FormItem label="实例名称" required>
            <Input v-model:value="formState.instanceName" placeholder="例如: redis-cache-01" />
          </FormItem>
          <Row :gutter="16">
            <Col :span="16">
              <FormItem label="主机地址" required>
                <Input v-model:value="formState.host" placeholder="192.168.1.100" />
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

      <!-- Step 1: Redis Config -->
      <div v-show="currentStep === 1">
        <Form layout="vertical" :model="formState" style="max-width: 600px">
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="Redis 版本">
                <Select v-model:value="formState.redisVersion">
                  <Select.Option value="7.2">Redis 7.2</Select.Option>
                  <Select.Option value="7.0">Redis 7.0</Select.Option>
                  <Select.Option value="6.2">Redis 6.2</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="Redis 端口">
                <InputNumber v-model:value="formState.redisPort" :min="1" :max="65535" style="width: 100%" />
              </FormItem>
            </Col>
          </Row>
          <FormItem label="Redis 密码">
            <Input.Password v-model:value="formState.redisPassword" placeholder="留空则不设密码" />
          </FormItem>
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="最大内存(MB)">
                <InputNumber v-model:value="formState.maxMemory" :min="64" :step="256" style="width: 100%" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="淘汰策略">
                <Select v-model:value="formState.maxMemoryPolicy">
                  <Select.Option value="noeviction">noeviction</Select.Option>
                  <Select.Option value="allkeys-lru">allkeys-lru</Select.Option>
                  <Select.Option value="volatile-lru">volatile-lru</Select.Option>
                  <Select.Option value="allkeys-random">allkeys-random</Select.Option>
                  <Select.Option value="volatile-ttl">volatile-ttl</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="持久化">
                <Select v-model:value="formState.persistenceMode">
                  <Select.Option value="rdb">RDB</Select.Option>
                  <Select.Option value="aof">AOF</Select.Option>
                  <Select.Option value="both">RDB + AOF</Select.Option>
                  <Select.Option value="none">无</Select.Option>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <FormItem label="数据目录">
            <Input v-model:value="formState.dataDir" />
          </FormItem>

          <Divider>集群 / 哨兵</Divider>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="部署模式">
                <Select v-model:value="formState.deployMode">
                  <Select.Option value="standalone">独立 (Standalone)</Select.Option>
                  <Select.Option value="sentinel">哨兵 (Sentinel)</Select.Option>
                  <Select.Option value="cluster">集群 (Cluster)</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="角色">
                <Select v-model:value="formState.role">
                  <Select.Option value="master">Master</Select.Option>
                  <Select.Option value="slave">Slave</Select.Option>
                  <Select.Option v-if="formState.deployMode === 'sentinel'" value="sentinel">Sentinel</Select.Option>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <template v-if="formState.role === 'slave'">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="主节点地址">
                  <Input v-model:value="formState.masterHost" />
                </FormItem>
              </Col>
              <Col :span="6">
                <FormItem label="主节点端口">
                  <InputNumber v-model:value="formState.masterPort" style="width: 100%" />
                </FormItem>
              </Col>
              <Col :span="6">
                <FormItem label="主节点密码">
                  <Input.Password v-model:value="formState.masterPassword" />
                </FormItem>
              </Col>
            </Row>
          </template>
          <template v-if="formState.deployMode === 'sentinel'">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="Sentinel Master Name">
                  <Input v-model:value="formState.sentinelMasterName" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="Quorum">
                  <InputNumber v-model:value="formState.sentinelQuorum" :min="1" style="width: 100%" />
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
          <Col :span="8"><strong>Redis版本:</strong> {{ formState.redisVersion }}</Col>
        </Row>
        <Row :gutter="16" class="mb-4">
          <Col :span="6"><strong>端口:</strong> {{ formState.redisPort }}</Col>
          <Col :span="6"><strong>模式:</strong> {{ formState.deployMode }}</Col>
          <Col :span="6"><strong>角色:</strong> {{ formState.role }}</Col>
          <Col :span="6"><strong>内存:</strong> {{ formState.maxMemory }}MB</Col>
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
