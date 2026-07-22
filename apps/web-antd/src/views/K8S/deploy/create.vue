<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Steps, Step, Form, FormItem, Input, InputNumber, Select, SelectOption, Button, Space, Switch, Table, Tag, message } from 'ant-design-vue';
import { getSupportedVersions, getSupportedCni, getSupportedCri, getSupportedStorage, createDeployPlan } from '../api/deploy';

const router = useRouter();
const currentStep = ref(0);
const submitting = ref(false);

const versions = ref<string[]>([]);
const cniList = ref<any[]>([]);
const criList = ref<any[]>([]);
const storageList = ref<any[]>([]);

const form = reactive({
  planName: '',
  k8sVersion: '',
  deployType: 'single',
  networkPlugin: 'calico',
  containerRuntime: 'containerd',
  podCidr: '10.244.0.0/16',
  serviceCidr: '10.96.0.0/12',
  installMetricsServer: true,
  installIngressNginx: false,
  storagePlugin: 'local-path',
  registryUrl: '',
});

const nodes = ref<any[]>([{ host: '', sshPort: 22, sshUser: 'root', sshPassword: '', role: 'master', hostname: '' }]);

const nodeColumns = [
  { title: 'IP地址', key: 'host', width: 180 },
  { title: '端口', key: 'sshPort', width: 80 },
  { title: '用户', key: 'sshUser', width: 100 },
  { title: '密码', key: 'sshPassword', width: 150 },
  { title: '角色', key: 'role', width: 120 },
  { title: '主机名', key: 'hostname', width: 130 },
  { title: '操作', key: 'action', width: 80 },
];

function addNode() {
  nodes.value.push({ host: '', sshPort: 22, sshUser: 'root', sshPassword: '', role: 'worker', hostname: '' });
}
function removeNode(idx: number) { nodes.value.splice(idx, 1); }

function nextStep() {
  if (currentStep.value === 0) {
    if (!form.planName || !form.k8sVersion) { message.warning('请填写计划名称和K8s版本'); return; }
  } else if (currentStep.value === 1) {
    if (nodes.value.length === 0 || !nodes.value[0].host) { message.warning('请添加至少一个节点'); return; }
    if (!nodes.value.some(n => n.role === 'master')) { message.warning('至少需要一个Master节点'); return; }
  }
  currentStep.value++;
}
function prevStep() { currentStep.value--; }

async function handleSubmit() {
  submitting.value = true;
  try {
    await createDeployPlan({ ...form, nodes: nodes.value });
    message.success('部署计划创建成功');
    router.push('/K8S/deploy/list');
  } catch (e: any) { message.error('创建失败: ' + e.message); }
  finally { submitting.value = false; }
}

onMounted(async () => {
  try {
    const [v, cni, cri, storage] = await Promise.all([getSupportedVersions(), getSupportedCni(), getSupportedCri(), getSupportedStorage()]);
    versions.value = Array.isArray(v) ? v : [];
    cniList.value = Array.isArray(cni) ? cni : [];
    criList.value = Array.isArray(cri) ? cri : [];
    storageList.value = Array.isArray(storage) ? storage : [];
    if (versions.value.length > 0) form.k8sVersion = versions.value[0]!;
  } catch { /* ignore */ }
});
</script>

<template>
  <div class="p-4">
    <Card title="创建部署计划">
      <Steps :current="currentStep" style="margin-bottom:32px">
        <Step title="基本信息" />
        <Step title="节点配置" />
        <Step title="组件配置" />
        <Step title="确认部署" />
      </Steps>

      <!-- Step 1: Basic Info -->
      <div v-show="currentStep === 0">
        <Form layout="vertical" style="max-width:500px">
          <FormItem label="集群名称" required>
            <Input v-model:value="form.planName" placeholder="如: production-cluster" />
          </FormItem>
          <FormItem label="Kubernetes 版本" required>
            <Select v-model:value="form.k8sVersion" style="width:100%">
              <SelectOption v-for="v in versions" :key="v" :value="v">{{ v }}</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="部署模式">
            <Select v-model:value="form.deployType" style="width:100%">
              <SelectOption value="single">单Master</SelectOption>
              <SelectOption value="ha">高可用 (多Master)</SelectOption>
            </Select>
          </FormItem>
        </Form>
      </div>

      <!-- Step 2: Nodes -->
      <div v-show="currentStep === 1">
        <div style="margin-bottom:12px">
          <Button type="primary" size="small" @click="addNode">添加节点</Button>
        </div>
        <Table :columns="nodeColumns" :data-source="nodes" :pagination="false" row-key="host" size="small">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'host'">
              <Input v-model:value="record.host" size="small" placeholder="198.51.100.x" />
            </template>
            <template v-if="column.key === 'sshPort'">
              <InputNumber v-model:value="record.sshPort" size="small" :min="1" :max="65535" style="width:100%" />
            </template>
            <template v-if="column.key === 'sshUser'">
              <Input v-model:value="record.sshUser" size="small" />
            </template>
            <template v-if="column.key === 'sshPassword'">
              <Input.Password v-model:value="record.sshPassword" size="small" />
            </template>
            <template v-if="column.key === 'role'">
              <Select v-model:value="record.role" size="small" style="width:100%">
                <SelectOption value="master">Master</SelectOption>
                <SelectOption value="worker">Worker</SelectOption>
              </Select>
            </template>
            <template v-if="column.key === 'hostname'">
              <Input v-model:value="record.hostname" size="small" placeholder="可选" />
            </template>
            <template v-if="column.key === 'action'">
              <Button type="link" size="small" danger @click="removeNode(index)" :disabled="nodes.length <= 1">删除</Button>
            </template>
          </template>
        </Table>
      </div>

      <!-- Step 3: Components -->
      <div v-show="currentStep === 2">
        <Form layout="vertical" style="max-width:500px">
          <FormItem label="网络插件 (CNI)">
            <Select v-model:value="form.networkPlugin" style="width:100%">
              <SelectOption v-for="c in cniList" :key="c.name" :value="c.name">
                {{ c.label }} — {{ c.description }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="容器运行时 (CRI)">
            <Select v-model:value="form.containerRuntime" style="width:100%">
              <SelectOption v-for="c in criList" :key="c.name" :value="c.name">
                {{ c.label }} — {{ c.description }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="Pod CIDR">
            <Input v-model:value="form.podCidr" />
          </FormItem>
          <FormItem label="Service CIDR">
            <Input v-model:value="form.serviceCidr" />
          </FormItem>
          <FormItem label="存储插件">
            <Select v-model:value="form.storagePlugin" style="width:100%">
              <SelectOption v-for="s in storageList" :key="s.name" :value="s.name">
                {{ s.label }} — {{ s.description }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="私有镜像仓库">
            <Input v-model:value="form.registryUrl" placeholder="如 10.0.0.1:80，留空使用公共镜像源" allow-clear />
            <div style="color:hsl(var(--muted-foreground));font-size:12px;margin-top:4px">
              填写私有 Harbor 仓库地址后，所有镜像将从该仓库拉取（需提前同步镜像）
            </div>
          </FormItem>
          <FormItem label="可选组件">
            <div style="display:flex;gap:24px">
              <label><Switch v-model:checked="form.installMetricsServer" size="small" /> metrics-server</label>
              <label><Switch v-model:checked="form.installIngressNginx" size="small" /> ingress-nginx</label>
            </div>
          </FormItem>
        </Form>
      </div>

      <!-- Step 4: Confirm -->
      <div v-show="currentStep === 3">
        <Card size="small" title="部署确认" style="max-width:600px">
          <p><strong>集群名称:</strong> {{ form.planName }}</p>
          <p><strong>K8s版本:</strong> {{ form.k8sVersion }}</p>
          <p><strong>部署模式:</strong> {{ form.deployType === 'ha' ? '高可用' : '单Master' }}</p>
          <p><strong>网络插件:</strong> {{ form.networkPlugin }}</p>
          <p><strong>容器运行时:</strong> {{ form.containerRuntime }}</p>
          <p><strong>Pod CIDR:</strong> {{ form.podCidr }}</p>
          <p><strong>Service CIDR:</strong> {{ form.serviceCidr }}</p>
          <p><strong>镜像仓库:</strong> {{ form.registryUrl || '公共镜像源（自动探测）' }}</p>
          <p><strong>节点数:</strong> {{ nodes.length }} (Master: {{ nodes.filter(n => n.role === 'master').length }}, Worker: {{ nodes.filter(n => n.role === 'worker').length }})</p>
          <div style="margin-top:12px">
            <Tag v-for="n in nodes" :key="n.host" :color="n.role === 'master' ? 'blue' : 'green'">
              {{ n.host }} ({{ n.role }})
            </Tag>
          </div>
        </Card>
      </div>

      <!-- Navigation -->
      <div style="margin-top:24px;display:flex;justify-content:space-between">
        <Button @click="() => router.push('/K8S/deploy/list')">取消</Button>
        <Space>
          <Button v-if="currentStep > 0" @click="prevStep">上一步</Button>
          <Button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</Button>
          <Button v-if="currentStep === 3" type="primary" @click="handleSubmit" :loading="submitting">创建计划</Button>
        </Space>
      </div>
    </Card>
  </div>
</template>
