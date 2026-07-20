<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Descriptions,
  DescriptionsItem,
  Tag,
  Table,
  Tabs,
  TabPane,
  Button,
  Space,
  Modal,
  Spin,
  message,
} from 'ant-design-vue';
import { getJob, rerunJob, getCronJob, triggerCronJob } from '../api/job';
import YamlEditor from '../components/YamlEditor.vue';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.params.clusterId);
const namespace = route.params.namespace as string;
const type = route.params.type as string; // 'Job' or 'CronJob'
const name = route.params.name as string;

const loading = ref(true);
const info = ref<any>(null);
const activeTab = ref('info');

const statusColor: Record<string, string> = {
  Completed: 'green',
  Running: 'blue',
  Failed: 'red',
  Pending: 'orange',
  Active: 'green',
  Suspended: 'default',
};

async function fetchData() {
  loading.value = true;
  try {
    if (type === 'CronJob') {
      info.value = await getCronJob(clusterId, namespace, name);
    } else {
      info.value = await getJob(clusterId, namespace, name);
    }
  } catch (e: any) {
    message.error('获取信息失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push(`/K8S/job/list?clusterId=${clusterId}&namespace=${namespace}`);
}

function handleRerun() {
  Modal.confirm({
    title: '确认重新执行',
    content: `确定要重新执行Job「${name}」吗？`,
    async onOk() {
      try {
        await rerunJob(clusterId, namespace, name);
        message.success('已重新执行');
        fetchData();
      } catch (e: any) {
        message.error('操作失败: ' + e.message);
      }
    },
  });
}

function handleTrigger() {
  Modal.confirm({
    title: '确认触发',
    content: `确定要手动触发CronJob「${name}」吗？`,
    async onOk() {
      try {
        await triggerCronJob(clusterId, namespace, name);
        message.success('已触发');
        fetchData();
      } catch (e: any) {
        message.error('操作失败: ' + e.message);
      }
    },
  });
}

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- 顶部 -->
      <Card class="mb-4">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0;">
              <Tag color="purple">{{ type }}</Tag>
              {{ name }}
            </h2>
            <Space class="mt-1">
              <Tag :color="statusColor[info?.status] || 'default'">{{ info?.status || '-' }}</Tag>
              <span style="color: #8c8c8c;">{{ namespace }}</span>
            </Space>
          </div>
          <Space>
            <Button v-if="type === 'Job'" @click="handleRerun">重新执行</Button>
            <Button v-if="type === 'CronJob'" @click="handleTrigger">手动触发</Button>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回列表</Button>
          </Space>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <!-- 基本信息 -->
        <TabPane key="info" tab="基本信息">
          <!-- Job信息 -->
          <Card v-if="type === 'Job'" title="Job属性" class="mb-4">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ info?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ info?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="statusColor[info?.status] || 'default'">{{ info?.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem label="活跃">{{ info?.active || 0 }}</DescriptionsItem>
              <DescriptionsItem label="成功">{{ info?.succeeded || 0 }}</DescriptionsItem>
              <DescriptionsItem label="失败">{{ info?.failed || 0 }}</DescriptionsItem>
              <DescriptionsItem label="退避限制">{{ info?.backoffLimit ?? '-' }}</DescriptionsItem>
              <DescriptionsItem label="完成数">{{ info?.completions ?? '-' }}</DescriptionsItem>
              <DescriptionsItem label="并行度">{{ info?.parallelism ?? '-' }}</DescriptionsItem>
              <DescriptionsItem label="开始时间">{{ info?.startTime || '-' }}</DescriptionsItem>
              <DescriptionsItem label="完成时间">{{ info?.completionTime || '-' }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ info?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>

          <!-- CronJob信息 -->
          <Card v-if="type === 'CronJob'" title="CronJob属性" class="mb-4">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ info?.name }}</DescriptionsItem>
              <DescriptionsItem label="命名空间">{{ info?.namespace }}</DescriptionsItem>
              <DescriptionsItem label="调度表达式">
                <Tag color="blue">{{ info?.schedule }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="statusColor[info?.status] || 'default'">{{ info?.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem label="暂停">{{ info?.suspend ? '是' : '否' }}</DescriptionsItem>
              <DescriptionsItem label="并发策略">{{ info?.concurrencyPolicy || '-' }}</DescriptionsItem>
              <DescriptionsItem label="成功保留数">{{ info?.successfulJobsHistoryLimit ?? '-' }}</DescriptionsItem>
              <DescriptionsItem label="失败保留数">{{ info?.failedJobsHistoryLimit ?? '-' }}</DescriptionsItem>
              <DescriptionsItem label="上次调度">{{ info?.lastScheduleTime || '-' }}</DescriptionsItem>
              <DescriptionsItem label="上次成功">{{ info?.lastSuccessfulTime || '-' }}</DescriptionsItem>
              <DescriptionsItem label="活跃Job数">{{ info?.activeJobs || 0 }}</DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ info?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </Card>

          <!-- 容器信息 -->
          <Card v-if="info?.containers?.length" title="容器" class="mb-4">
            <Table
              :data-source="info.containers"
              :pagination="false"
              row-key="name"
              size="small"
            >
              <Table.Column title="容器名" dataIndex="name" />
              <Table.Column title="镜像" dataIndex="image" :ellipsis="true" />
              <Table.Column title="命令" key="command">
                <template #default="{ record }">
                  {{ record.command ? record.command.join(' ') : '-' }}
                </template>
              </Table.Column>
            </Table>
          </Card>

          <!-- 关联Pod（Job） -->
          <Card v-if="type === 'Job' && info?.pods?.length" title="关联Pod" class="mb-4">
            <Table
              :data-source="info.pods"
              :pagination="false"
              row-key="name"
              size="small"
            >
              <Table.Column title="Pod名称" dataIndex="name" />
              <Table.Column title="状态" dataIndex="status">
                <template #default="{ record }">
                  <Tag :color="statusColor[record.status] || 'default'">{{ record.status }}</Tag>
                </template>
              </Table.Column>
              <Table.Column title="创建时间" dataIndex="createdAt" />
            </Table>
          </Card>

          <!-- 最近Job（CronJob） -->
          <Card v-if="type === 'CronJob' && info?.recentJobs?.length" title="最近执行的Job">
            <Table
              :data-source="info.recentJobs"
              :pagination="false"
              row-key="name"
              size="small"
            >
              <Table.Column title="Job名称" dataIndex="name" />
              <Table.Column title="状态" dataIndex="status">
                <template #default="{ record }">
                  <Tag :color="statusColor[record.status] || 'default'">{{ record.status }}</Tag>
                </template>
              </Table.Column>
              <Table.Column title="成功" dataIndex="succeeded" :width="60" />
              <Table.Column title="失败" dataIndex="failed" :width="60" />
              <Table.Column title="创建时间" dataIndex="createdAt" />
            </Table>
          </Card>
        </TabPane>

        <!-- YAML -->
        <TabPane key="yaml" tab="YAML">
          <Card>
            <YamlEditor :model-value="info?.yaml || ''" :read-only="true" height="600px" theme="light" />
          </Card>
        </TabPane>
      </Tabs>
    </Spin>
  </div>
</template>
