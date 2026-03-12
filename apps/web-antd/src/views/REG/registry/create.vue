<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  Space,
  Steps,
  Switch,
  Textarea,
} from 'ant-design-vue';

import { checkPort, createRegistry } from '../api/registry';
import { deployRegistry } from '../api/deploy';

const router = useRouter();
const currentStep = ref(0);
const submitting = ref(false);
const portChecking = ref(false);
const portCheckResult = ref<{ occupied?: boolean; detail?: string; error?: string } | null>(null);

const formData = ref({
  registryName: '',
  registryType: 'harbor' as 'harbor' | 'gitlab' | 'docker_distribution',
  description: '',
  deployMode: 'ssh' as 'ssh' | 'k8s',
  // SSH fields
  host: '',
  sshPort: 22,
  sshUser: 'root',
  encryptedPassword: '',
  installPath: '',
  servicePort: null as number | null,
  // K8s fields
  clusterId: null as number | null,
  namespace: 'default',
  releaseName: '',
  helmValues: '',
  // Access config
  adminUser: 'admin',
  encryptedAdminPassword: '',
  useSsl: false,
  endpoint: '',
  version: '',
});

const steps = [
  { title: '基本信息' },
  { title: '部署方式' },
  { title: '仓库配置' },
  { title: '确认部署' },
];

// Auto-set admin username based on registry type
watch(() => formData.value.registryType, (type) => {
  const defaultUsers: Record<string, string> = {
    harbor: 'admin',
    gitlab: 'root',
    docker_distribution: 'admin',
  };
  formData.value.adminUser = defaultUsers[type] || 'admin';
});

function nextStep() {
  if (currentStep.value === 0) {
    if (!formData.value.registryName) {
      message.warning('请输入仓库名称');
      return;
    }
  }
  if (currentStep.value === 1) {
    if (formData.value.deployMode === 'ssh' && !formData.value.host) {
      message.warning('请输入主机地址');
      return;
    }
    if (formData.value.deployMode === 'k8s' && !formData.value.clusterId) {
      message.warning('请选择集群');
      return;
    }
  }
  currentStep.value++;
}

function prevStep() {
  currentStep.value--;
}

function getDefaultInstallPath() {
  const typeMap: Record<string, string> = {
    harbor: '/opt/harbor',
    gitlab: '/opt/gitlab',
    docker_distribution: '/opt/registry',
  };
  return typeMap[formData.value.registryType] || '/opt/registry';
}

function getDefaultPort() {
  const portMap: Record<string, number> = {
    harbor: 80,
    gitlab: 80,
    docker_distribution: 5000,
  };
  return portMap[formData.value.registryType] || 80;
}

async function handleCheckPort() {
  const fd = formData.value;
  if (!fd.host) {
    message.warning('请先填写主机地址');
    return;
  }
  if (!fd.encryptedPassword) {
    message.warning('请先填写 SSH 密码');
    return;
  }
  const port = fd.servicePort || getDefaultPort();
  portChecking.value = true;
  portCheckResult.value = null;
  try {
    const res = await checkPort({
      host: fd.host,
      sshPort: fd.sshPort || 22,
      sshUser: fd.sshUser || 'root',
      password: fd.encryptedPassword,
      port,
    });
    const data = res as any;
    portCheckResult.value = data;
    if (data.error) {
      message.error(data.error);
    } else if (data.occupied) {
      message.warning(`端口 ${port} 已被占用`);
    } else {
      message.success(`端口 ${port} 可用`);
    }
  } catch (e: any) {
    message.error('端口检测失败: ' + (e.message || e));
  } finally {
    portChecking.value = false;
  }
}

async function handleSubmit() {
  submitting.value = true;
  try {
    const data = { ...formData.value };
    if (!data.installPath) {
      data.installPath = getDefaultInstallPath();
    }
    // Auto-generate endpoint if not set
    if (!data.endpoint && data.deployMode === 'ssh' && data.host) {
      const scheme = data.useSsl ? 'https' : 'http';
      const port = data.servicePort || getDefaultPort();
      const portSuffix = port === 80 || port === 443 ? '' : `:${port}`;
      data.endpoint = `${scheme}://${data.host}${portSuffix}`;
    }

    const created = await createRegistry(data);
    const registryId = (created as any)?.id;
    message.success('仓库创建成功');

    if (registryId) {
      try {
        await deployRegistry(registryId);
        message.success('部署任务已提交');
      } catch (e: any) {
        message.warning('创建成功但部署提交失败: ' + (e.message || e));
      }
      router.push(`/REG/registry/detail/${registryId}`);
    } else {
      router.push('/REG/registry/list');
    }
  } catch (e: any) {
    message.error('创建失败: ' + (e.message || e));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="p-4">
    <Card title="创建仓库">
      <template #extra>
        <Button @click="router.push('/REG/registry/list')">返回列表</Button>
      </template>

      <Steps :current="currentStep" class="mb-8">
        <Steps.Step v-for="s in steps" :key="s.title" :title="s.title" />
      </Steps>

      <!-- Step 1: Basic Info -->
      <div v-show="currentStep === 0">
        <Form layout="vertical" class="max-w-lg">
          <FormItem label="仓库名称" required>
            <Input v-model:value="formData.registryName" placeholder="请输入仓库名称" />
          </FormItem>
          <FormItem label="仓库类型">
            <RadioGroup v-model:value="formData.registryType">
              <Radio value="harbor">Harbor</Radio>
              <Radio value="gitlab">GitLab</Radio>
              <Radio value="docker_distribution">Docker Registry</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem label="版本">
            <Input v-model:value="formData.version" placeholder="留空则使用最新版本" />
          </FormItem>
          <FormItem label="描述">
            <Textarea v-model:value="formData.description" :rows="3" placeholder="请输入描述" />
          </FormItem>
        </Form>
      </div>

      <!-- Step 2: Deploy Mode -->
      <div v-show="currentStep === 1">
        <Form layout="vertical" class="max-w-lg">
          <FormItem label="部署方式">
            <RadioGroup v-model:value="formData.deployMode">
              <Radio value="ssh">SSH 远程部署</Radio>
              <Radio value="k8s">K8s 集群部署</Radio>
            </RadioGroup>
          </FormItem>

          <!-- SSH fields -->
          <template v-if="formData.deployMode === 'ssh'">
            <FormItem label="主机地址" required>
              <Input v-model:value="formData.host" placeholder="IP 地址或主机名" />
            </FormItem>
            <FormItem label="SSH 端口">
              <InputNumber v-model:value="formData.sshPort" :min="1" :max="65535" style="width: 100%" />
            </FormItem>
            <FormItem label="SSH 用户">
              <Input v-model:value="formData.sshUser" placeholder="root" />
            </FormItem>
            <FormItem label="SSH 密码">
              <Input.Password v-model:value="formData.encryptedPassword" placeholder="请输入密码" />
            </FormItem>
            <FormItem label="服务端口">
              <Space>
                <InputNumber
                  v-model:value="formData.servicePort"
                  :min="1"
                  :max="65535"
                  :placeholder="String(getDefaultPort())"
                  style="width: 200px"
                />
                <Button :loading="portChecking" @click="handleCheckPort">检测端口</Button>
              </Space>
              <div v-if="portCheckResult" class="mt-1 text-xs">
                <span v-if="portCheckResult.error" class="text-red-500">{{ portCheckResult.error }}</span>
                <span v-else-if="portCheckResult.occupied" class="text-orange-500">端口已被占用</span>
                <span v-else class="text-green-500">端口可用</span>
              </div>
            </FormItem>
            <FormItem label="安装路径">
              <Input v-model:value="formData.installPath" :placeholder="getDefaultInstallPath()" />
            </FormItem>
          </template>

          <!-- K8s fields -->
          <template v-if="formData.deployMode === 'k8s'">
            <FormItem label="集群 ID" required>
              <InputNumber v-model:value="formData.clusterId" :min="1" placeholder="K8s 集群 ID" style="width: 100%" />
            </FormItem>
            <FormItem label="命名空间">
              <Input v-model:value="formData.namespace" placeholder="default" />
            </FormItem>
            <FormItem label="Release 名称">
              <Input v-model:value="formData.releaseName" placeholder="自动生成" />
            </FormItem>
            <FormItem label="Helm Values (YAML)">
              <Textarea v-model:value="formData.helmValues" :rows="6" placeholder="自定义 Helm values.yaml 内容" />
            </FormItem>
          </template>
        </Form>
      </div>

      <!-- Step 3: Registry Config -->
      <div v-show="currentStep === 2">
        <Form layout="vertical" class="max-w-lg">
          <FormItem label="管理员用户名">
            <Input
              v-model:value="formData.adminUser"
              :disabled="formData.registryType === 'harbor' || formData.registryType === 'gitlab'"
              :placeholder="formData.registryType === 'gitlab' ? 'root' : 'admin'"
            />
            <div class="mt-1 text-xs text-gray-400">
              <span v-if="formData.registryType === 'harbor'">Harbor 管理员用户名固定为 admin，不可更改</span>
              <span v-else-if="formData.registryType === 'gitlab'">GitLab 管理员用户名固定为 root，不可更改</span>
              <span v-else>Docker Registry 使用 htpasswd 认证</span>
            </div>
          </FormItem>
          <FormItem label="管理员密码" required>
            <Input.Password v-model:value="formData.encryptedAdminPassword" placeholder="请输入管理员密码" />
          </FormItem>
          <FormItem label="启用 SSL">
            <Switch v-model:checked="formData.useSsl" />
          </FormItem>
          <FormItem label="访问地址">
            <Input v-model:value="formData.endpoint" placeholder="http://host:port (可选，自动生成)" />
          </FormItem>
        </Form>
      </div>

      <!-- Step 4: Confirm -->
      <div v-show="currentStep === 3">
        <div class="max-w-lg space-y-2">
          <p><strong>仓库名称:</strong> {{ formData.registryName }}</p>
          <p><strong>仓库类型:</strong> {{ { harbor: 'Harbor', gitlab: 'GitLab', docker_distribution: 'Docker Registry' }[formData.registryType] }}</p>
          <p><strong>版本:</strong> {{ formData.version || 'latest' }}</p>
          <p><strong>部署方式:</strong> {{ formData.deployMode === 'ssh' ? 'SSH 远程部署' : 'K8s 集群部署' }}</p>
          <template v-if="formData.deployMode === 'ssh'">
            <p><strong>目标主机:</strong> {{ formData.host }}:{{ formData.sshPort }}</p>
            <p><strong>服务端口:</strong> {{ formData.servicePort || getDefaultPort() }}</p>
            <p><strong>安装路径:</strong> {{ formData.installPath || getDefaultInstallPath() }}</p>
          </template>
          <template v-if="formData.deployMode === 'k8s'">
            <p><strong>集群 ID:</strong> {{ formData.clusterId }}</p>
            <p><strong>命名空间:</strong> {{ formData.namespace }}</p>
          </template>
          <p><strong>管理员:</strong> {{ formData.adminUser }}</p>
          <p><strong>SSL:</strong> {{ formData.useSsl ? '是' : '否' }}</p>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="mt-8 flex gap-3">
        <Button v-if="currentStep > 0" @click="prevStep">上一步</Button>
        <Button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</Button>
        <Button
          v-if="currentStep === 3"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确认并部署
        </Button>
      </div>
    </Card>
  </div>
</template>
