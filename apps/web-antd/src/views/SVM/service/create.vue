<script lang="ts" setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Steps, Step, Button, Space, Form, FormItem, Select, SelectOption,
  Table, Tag, message,
} from 'ant-design-vue';
import { getClusters } from '../../CLM/api/cluster';
import { getFrameworks, getServiceDefs, getRoleDefs } from '../api/framework';
import { getHosts } from '../../HOM/api/host';
import { createServiceInstance, addRoleInstance } from '../api/service';
import type { Cluster } from '../../CLM/api/types';
import type { Framework, ServiceDef, RoleDef } from '../api/types';
import type { Host } from '../../HOM/api/types';

const router = useRouter();
const currentStep = ref(0);

// Step 1: Select cluster & framework
const clusters = ref<Cluster[]>([]);
const frameworks = ref<Framework[]>([]);
const formState = reactive({
  clusterId: undefined as number | undefined,
  frameworkId: undefined as number | undefined,
  serviceDefId: undefined as number | undefined,
});

// Step 2: View service def + role defs, assign hosts
const serviceDefs = ref<ServiceDef[]>([]);
const selectedServiceDef = ref<ServiceDef | null>(null);
const roleDefs = ref<RoleDef[]>([]);
const hosts = ref<Host[]>([]);
const roleHostAssignments = ref<Record<number, number | undefined>>({});

// Step 3: Review
const submitting = ref(false);

const canNext = computed(() => {
  if (currentStep.value === 0) {
    return formState.clusterId && formState.frameworkId && formState.serviceDefId;
  }
  if (currentStep.value === 1) {
    // All roles must have hosts assigned
    return roleDefs.value.length > 0 &&
      roleDefs.value.every(r => roleHostAssignments.value[r.id]);
  }
  return true;
});

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function fetchFrameworks() {
  try {
    const res = await getFrameworks();
    frameworks.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function onFrameworkChange(val: number) {
  formState.frameworkId = val;
  formState.serviceDefId = undefined;
  serviceDefs.value = [];
  if (!val) return;
  try {
    const res = await getServiceDefs(val);
    serviceDefs.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function onServiceDefChange(val: number) {
  formState.serviceDefId = val;
  selectedServiceDef.value = serviceDefs.value.find(s => s.id === val) || null;
}

async function loadStep2Data() {
  // Load role defs for selected service
  if (!formState.frameworkId || !formState.serviceDefId) return;
  try {
    const res = await getRoleDefs(formState.frameworkId, formState.serviceDefId);
    roleDefs.value = Array.isArray(res) ? res : [];
    // Reset assignments
    roleHostAssignments.value = {};
  } catch (e: any) {
    message.error('获取角色定义失败: ' + e.message);
  }
  // Load hosts for selected cluster
  if (!formState.clusterId) return;
  try {
    const res = await getHosts(formState.clusterId);
    hosts.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取主机列表失败: ' + e.message);
  }
}

function nextStep() {
  if (currentStep.value === 0) {
    loadStep2Data();
  }
  currentStep.value++;
}

function prevStep() {
  currentStep.value--;
}

function getHostName(hostId: number | undefined) {
  if (!hostId) return '-';
  const h = hosts.value.find(x => x.id === hostId);
  return h ? `${h.hostname} (${h.ipAddress})` : String(hostId);
}

async function handleSubmit() {
  if (!formState.clusterId || !formState.serviceDefId || !selectedServiceDef.value) return;

  submitting.value = true;
  try {
    // 1. Create ServiceInstance
    const si = await createServiceInstance({
      clusterId: formState.clusterId,
      serviceDefId: formState.serviceDefId,
      serviceName: selectedServiceDef.value.serviceName,
      status: 'not_installed',
      configJson: selectedServiceDef.value.configJson || '{}',
      configVersion: 1,
      needRestart: false,
    });

    const serviceInstanceId = (si as any)?.id || (si as any)?.data?.id;
    if (!serviceInstanceId) {
      message.error('创建服务实例失败：未返回ID');
      return;
    }

    // 2. Create RoleInstances
    for (const roleDef of roleDefs.value) {
      const hostId = roleHostAssignments.value[roleDef.id];
      if (!hostId) continue;
      const host = hosts.value.find(h => h.id === hostId);
      await addRoleInstance(serviceInstanceId, {
        roleDefId: roleDef.id,
        roleName: roleDef.roleName,
        roleType: roleDef.roleType,
        hostId,
        hostname: host?.hostname || '',
        status: 'not_installed',
        needRestart: false,
      });
    }

    message.success('服务创建成功');
    router.push('/SVM/service/list');
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/SVM/service/list');
}

onMounted(() => {
  fetchClusters();
  fetchFrameworks();
});
</script>

<template>
  <div class="p-4">
    <Card>
      <template #title>
        <Space>
          <Button size="small" @click="goBack">返回</Button>
          <span>创建服务</span>
        </Space>
      </template>

      <Steps :current="currentStep" style="margin-bottom: 24px">
        <Step title="选择服务" />
        <Step title="分配角色" />
        <Step title="确认创建" />
      </Steps>

      <!-- Step 1: Select cluster, framework, service def -->
      <div v-if="currentStep === 0">
        <Form layout="vertical" style="max-width: 500px">
          <FormItem label="选择集群" required>
            <Select
              v-model:value="formState.clusterId"
              placeholder="请选择集群"
              style="width: 100%"
            >
              <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">
                {{ c.clusterName }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="选择框架" required>
            <Select
              :value="formState.frameworkId"
              placeholder="请选择框架"
              style="width: 100%"
              @change="onFrameworkChange"
            >
              <SelectOption v-for="f in frameworks" :key="f.id" :value="f.id">
                {{ f.frameName }} ({{ f.frameVersion }})
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="选择服务" required>
            <Select
              :value="formState.serviceDefId"
              placeholder="请先选择框架"
              style="width: 100%"
              :disabled="!formState.frameworkId"
              @change="onServiceDefChange"
            >
              <SelectOption v-for="s in serviceDefs" :key="s.id" :value="s.id">
                {{ s.serviceName }} - {{ s.serviceLabel }}
              </SelectOption>
            </Select>
          </FormItem>
        </Form>
      </div>

      <!-- Step 2: Assign hosts to roles -->
      <div v-if="currentStep === 1">
        <Table
          :data-source="roleDefs"
          row-key="id"
          size="small"
          :pagination="false"
          :columns="[
            { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
            { title: '角色类型', dataIndex: 'roleType', key: 'roleType', width: 100 },
            { title: '基数', dataIndex: 'cardinality', key: 'cardinality', width: 80 },
            { title: '分配主机', key: 'host', width: 300 },
          ]"
        >
          <template #bodyCell="{ column, record: _record }">
            <template v-if="column.key === 'host'">
              <Select
                v-model:value="roleHostAssignments[(_record as RoleDef).id]"
                placeholder="选择主机"
                style="width: 100%"
              >
                <SelectOption v-for="h in hosts" :key="h.id" :value="h.id">
                  {{ h.hostname }} ({{ h.ipAddress }})
                </SelectOption>
              </Select>
            </template>
          </template>
        </Table>
        <div v-if="hosts.length === 0" style="color: #999; margin-top: 8px">
          该集群下暂无主机，请先在主机管理中添加主机。
        </div>
      </div>

      <!-- Step 3: Review -->
      <div v-if="currentStep === 2">
        <Card title="服务信息" size="small" style="margin-bottom: 16px">
          <p><strong>集群：</strong>{{ clusters.find(c => c.id === formState.clusterId)?.clusterName }}</p>
          <p><strong>框架：</strong>{{ frameworks.find(f => f.id === formState.frameworkId)?.frameName }}</p>
          <p><strong>服务：</strong>{{ selectedServiceDef?.serviceName }} - {{ selectedServiceDef?.serviceLabel }}</p>
        </Card>
        <Card title="角色分配" size="small">
          <Table
            :data-source="roleDefs"
            row-key="id"
            size="small"
            :pagination="false"
            :columns="[
              { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
              { title: '角色类型', dataIndex: 'roleType', key: 'roleType', width: 100 },
              { title: '分配主机', key: 'host' },
            ]"
          >
            <template #bodyCell="{ column, record: _record }">
              <template v-if="column.key === 'host'">
                <Tag color="blue">
                  {{ getHostName(roleHostAssignments[(_record as RoleDef).id]) }}
                </Tag>
              </template>
            </template>
          </Table>
        </Card>
      </div>

      <!-- Navigation buttons -->
      <div style="margin-top: 24px; text-align: right">
        <Space>
          <Button v-if="currentStep > 0" @click="prevStep">上一步</Button>
          <Button
            v-if="currentStep < 2"
            type="primary"
            :disabled="!canNext"
            @click="nextStep"
          >下一步</Button>
          <Button
            v-if="currentStep === 2"
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >确认创建</Button>
        </Space>
      </div>
    </Card>
  </div>
</template>
