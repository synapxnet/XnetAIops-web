<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  SelectOption,
  Textarea,
  Button,
  Space,
  Alert,
  Descriptions,
  DescriptionsItem,
  Tag,
  Divider,
  message,
} from 'ant-design-vue';
import { createCluster, testClusterConnection } from '../api/cluster';

const router = useRouter();
const submitting = ref(false);
const testing = ref(false);
const testResult = ref<any>(null);

const form = ref({
  name: '',
  description: '',
  provider: 'self-managed',
  kubeconfig: '',
  sshHost: '',
  sshPort: 22,
  sshUser: 'root',
  sshPassword: '',
  sshKey: '',
});

async function handleTest() {
  if (!form.value.kubeconfig.trim()) {
    message.warning('请先粘贴Kubeconfig内容');
    return;
  }
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testClusterConnection(form.value.kubeconfig);
    testResult.value = res;
    if ((res as any)?.connected) {
      message.success('连接成功');
    } else {
      message.error('连接失败: ' + ((res as any)?.error || '未知错误'));
    }
  } catch (e: any) {
    message.error('测试连接失败: ' + e.message);
  } finally {
    testing.value = false;
  }
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    message.warning('请输入集群名称');
    return;
  }
  if (!form.value.kubeconfig.trim()) {
    message.warning('请粘贴Kubeconfig内容');
    return;
  }
  submitting.value = true;
  try {
    await createCluster({
      name: form.value.name,
      description: form.value.description,
      provider: form.value.provider,
      kubeconfig: form.value.kubeconfig,
      sshHost: form.value.sshHost || undefined,
      sshPort: form.value.sshPort || 22,
      sshUser: form.value.sshUser || undefined,
      sshPassword: form.value.sshPassword || undefined,
      sshKey: form.value.sshKey || undefined,
    });
    message.success('集群添加成功');
    router.push('/K8S/cluster/list');
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/K8S/cluster/list');
}
</script>

<template>
  <div class="p-4">
    <Card title="添加Kubernetes集群">
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>

      <Form layout="vertical" :model="form" style="max-width: 800px;">
        <FormItem label="集群名称" required>
          <Input v-model:value="form.name" placeholder="请输入集群名称" />
        </FormItem>

        <FormItem label="集群描述">
          <Textarea v-model:value="form.description" placeholder="请输入集群描述" :rows="2" />
        </FormItem>

        <FormItem label="提供商">
          <Select v-model:value="form.provider">
            <SelectOption value="self-managed">自建集群</SelectOption>
            <SelectOption value="aliyun">阿里云 ACK</SelectOption>
            <SelectOption value="aws">AWS EKS</SelectOption>
            <SelectOption value="gcp">GCP GKE</SelectOption>
            <SelectOption value="huawei">华为云 CCE</SelectOption>
            <SelectOption value="tencent">腾讯云 TKE</SelectOption>
          </Select>
        </FormItem>

        <FormItem label="Kubeconfig" required>
          <Textarea
            v-model:value="form.kubeconfig"
            placeholder="请粘贴kubeconfig文件内容（YAML格式）"
            :rows="12"
            style="font-family: monospace; font-size: 12px;"
          />
        </FormItem>

        <!-- SSH Connection -->
        <Divider orientation="left">SSH 连接配置（Helm 部署需要）</Divider>
        <Alert type="info" showIcon style="margin-bottom:16px">
          <template #message>
            SSH 连接用于在集群 Master 节点上执行 Helm CLI 命令。如果需要使用应用商店的一键部署功能，请配置 SSH 信息。
          </template>
        </Alert>

        <FormItem label="SSH 主机地址">
          <Input v-model:value="form.sshHost" placeholder="集群Master节点IP或域名，如 127.0.0.1" />
        </FormItem>

        <FormItem label="SSH 端口">
          <InputNumber v-model:value="form.sshPort" :min="1" :max="65535" style="width:150px" />
        </FormItem>

        <FormItem label="SSH 用户名">
          <Input v-model:value="form.sshUser" placeholder="SSH登录用户名，如 root" />
        </FormItem>

        <FormItem label="SSH 密码">
          <Input.Password v-model:value="form.sshPassword" placeholder="SSH登录密码（与密钥二选一）" />
        </FormItem>

        <FormItem label="SSH 私钥">
          <Textarea
            v-model:value="form.sshKey"
            placeholder="SSH私钥内容（与密码二选一，粘贴PEM格式私钥）"
            :rows="4"
            style="font-family: monospace; font-size: 12px;"
          />
        </FormItem>

        <FormItem>
          <Space>
            <Button :loading="testing" @click="handleTest">测试连接</Button>
            <Button type="primary" :loading="submitting" @click="handleSubmit">添加集群</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 连接测试结果 -->
      <div v-if="testResult" style="margin-top: 16px; max-width: 800px;">
        <Alert
          :type="testResult.connected ? 'success' : 'error'"
          :message="testResult.connected ? '连接成功' : '连接失败'"
          show-icon
        />
        <Descriptions v-if="testResult.connected" bordered size="small" class="mt-3" :column="2">
          <DescriptionsItem label="Kubernetes版本">
            <Tag color="blue">{{ testResult.version }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="节点数量">{{ testResult.nodeCount }}</DescriptionsItem>
          <DescriptionsItem label="平台">{{ testResult.platform }}</DescriptionsItem>
          <DescriptionsItem label="API Server">{{ testResult.apiServerUrl }}</DescriptionsItem>
        </Descriptions>
        <div v-if="!testResult.connected" class="mt-2" style="color: #ff4d4f;">
          {{ testResult.error }}
        </div>
      </div>
    </Card>
  </div>
</template>
