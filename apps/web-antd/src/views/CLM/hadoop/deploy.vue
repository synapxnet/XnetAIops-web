<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Form, FormItem, Input, InputNumber, Select, Button, Steps, Step,
  Space, Divider, message, Row, Col, Alert, Checkbox,
} from 'ant-design-vue';
import { createHadoopCluster, testHadoopConnection, deployHadoopCluster } from '../api/hadoopCluster';
import type { HadoopCluster, HadoopDeployConfig } from '../api/types';

const router = useRouter();
const currentStep = ref(0);
const testing = ref(false);
const deploying = ref(false);
const testResult = ref<any>(null);
const createdId = ref<number | null>(null);

const serverForm = reactive<Partial<HadoopCluster>>({
  name: '', host: '', port: 22, sshUser: 'root', sshPassword: '',
  osType: 'centos7', nodeType: 'master', description: '',
});

const deployConfig = reactive<HadoopDeployConfig>({
  hadoopVersion: '3.3.6', osType: 'centos7', deployMode: 'standard',
  javaVersion: '8', components: ['hdfs', 'yarn', 'mapreduce'],
  hdfsDataDirs: ['/data/hadoop/hdfs'], hdfsReplication: 3,
  hdfsBlockSize: 134217728, yarnMemory: 8192, yarnCpu: 8,
});

async function handleTestConnection() {
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testHadoopConnection(serverForm) as any;
    testResult.value = res?.data || res;
    if (testResult.value?.success) {
      message.success('连接成功');
    } else {
      message.error(testResult.value?.message || '连接失败');
    }
  } catch (e: any) {
    message.error('连接测试失败: ' + e.message);
    testResult.value = { success: false, message: e.message };
  } finally {
    testing.value = false;
  }
}

async function handleCreateAndNext() {
  try {
    const res = await createHadoopCluster(serverForm) as any;
    const created = res?.data || res;
    createdId.value = created.id;
    message.success('服务器信息已保存');
    currentStep.value = 1;
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

async function handleDeploy() {
  if (!createdId.value) { message.error('请先保存服务器信息'); return; }
  deploying.value = true;
  try {
    const res = await deployHadoopCluster(createdId.value, deployConfig) as any;
    const data = res?.data || res;
    if (data?.success) {
      message.success('部署任务已启动');
      currentStep.value = 2;
    } else {
      message.error(data?.message || '部署失败');
    }
  } catch (e: any) {
    message.error('部署失败: ' + e.message);
  } finally {
    deploying.value = false;
  }
}

function goBack() { router.push('/CLM/hadoop/list'); }

const componentOptions = [
  { label: 'HDFS', value: 'hdfs' },
  { label: 'YARN', value: 'yarn' },
  { label: 'MapReduce', value: 'mapreduce' },
  { label: 'Hive', value: 'hive' },
  { label: 'HBase', value: 'hbase' },
  { label: 'Spark', value: 'spark' },
];
</script>

<template>
  <div class="p-4">
    <Card title="部署 Hadoop 集群">
      <Steps :current="currentStep" class="mb-6">
        <Step title="服务器配置" description="配置SSH连接信息" />
        <Step title="Hadoop配置" description="选择版本和组件" />
        <Step title="完成" description="部署结果" />
      </Steps>

      <!-- Step 1: 服务器配置 -->
      <div v-if="currentStep === 0">
        <Form layout="vertical" :model="serverForm">
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="节点名称" required>
                <Input v-model:value="serverForm.name" placeholder="如: hadoop-master-01" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="节点类型">
                <Select v-model:value="serverForm.nodeType">
                  <Select.Option value="master">Master</Select.Option>
                  <Select.Option value="node">Node</Select.Option>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="主机地址" required>
                <Input v-model:value="serverForm.host" placeholder="IP或域名" />
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="SSH端口">
                <InputNumber v-model:value="serverForm.port" :min="1" :max="65535" style="width: 100%" />
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="操作系统">
                <Select v-model:value="serverForm.osType">
                  <Select.Option value="centos7">CentOS 7</Select.Option>
                  <Select.Option value="centos8">CentOS 8</Select.Option>
                  <Select.Option value="ubuntu20">Ubuntu 20.04</Select.Option>
                  <Select.Option value="ubuntu22">Ubuntu 22.04</Select.Option>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="SSH用户名" required>
                <Input v-model:value="serverForm.sshUser" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="SSH密码" required>
                <Input.Password v-model:value="serverForm.sshPassword" placeholder="SSH登录密码" />
              </FormItem>
            </Col>
          </Row>
          <FormItem label="描述">
            <Input.TextArea v-model:value="serverForm.description" :rows="2" />
          </FormItem>

          <Alert v-if="testResult?.success" type="success" show-icon class="mb-4"
            :message="'连接成功 - ' + (testResult.hostname || '')" />
          <Alert v-if="testResult && !testResult.success" type="error" show-icon class="mb-4"
            :message="testResult.message" />

          <Space>
            <Button @click="goBack">返回</Button>
            <Button :loading="testing" @click="handleTestConnection">测试连接</Button>
            <Button type="primary" :disabled="!serverForm.name || !serverForm.host" @click="handleCreateAndNext">
              保存并继续
            </Button>
          </Space>
        </Form>
      </div>

      <!-- Step 2: Hadoop配置 -->
      <div v-if="currentStep === 1">
        <Form layout="vertical" :model="deployConfig">
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="Hadoop版本" required>
                <Input v-model:value="deployConfig.hadoopVersion" placeholder="如: 3.3.6" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="Java版本">
                <Select v-model:value="deployConfig.javaVersion">
                  <Select.Option value="8">Java 8</Select.Option>
                  <Select.Option value="11">Java 11</Select.Option>
                  <Select.Option value="17">Java 17</Select.Option>
                </Select>
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="部署模式">
                <Select v-model:value="deployConfig.deployMode">
                  <Select.Option value="standard">Standard</Select.Option>
                  <Select.Option value="ha">HA (高可用)</Select.Option>
                </Select>
              </FormItem>
            </Col>
          </Row>

          <Divider>组件选择</Divider>
          <FormItem label="安装组件">
            <Checkbox.Group v-model:value="deployConfig.components" :options="componentOptions" />
          </FormItem>

          <Divider>HDFS 配置</Divider>
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="副本因子">
                <InputNumber v-model:value="deployConfig.hdfsReplication" :min="1" :max="10" style="width: 100%" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="YARN内存(MB)">
                <InputNumber v-model:value="deployConfig.yarnMemory" :min="1024" :step="1024" style="width: 100%" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="YARN CPU核数">
                <InputNumber v-model:value="deployConfig.yarnCpu" :min="1" :max="128" style="width: 100%" />
              </FormItem>
            </Col>
          </Row>

          <Space>
            <Button @click="currentStep = 0">上一步</Button>
            <Button type="primary" :loading="deploying" @click="handleDeploy">开始部署</Button>
          </Space>
        </Form>
      </div>

      <!-- Step 3: 完成 -->
      <div v-if="currentStep === 2" style="text-align: center; padding: 40px">
        <Alert type="success" show-icon message="部署任务已提交" description="Hadoop部署脚本正在远程执行，您可以前往列表查看进度和日志。" />
        <div style="margin-top: 24px">
          <Button type="primary" @click="goBack">返回列表</Button>
        </div>
      </div>
    </Card>
  </div>
</template>
