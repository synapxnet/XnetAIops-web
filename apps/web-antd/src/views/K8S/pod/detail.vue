<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：Pod 详情及独立分区读取状态。Purpose: Pod detail and independent section read states.
Author: maoyo | Department: 研发部 | Date: 2026-09-14
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Alert,
  Card,
  Descriptions,
  DescriptionsItem,
  Tag,
  Table,
  Tabs,
  TabPane,
  Button,
  Space,
  Select,
  SelectOption,
  Spin,
  Empty,
} from 'ant-design-vue';
import type { SelectValue } from 'ant-design-vue/es/select';
import type { K8sEvent } from '../api/types';
import { getPod, getPodLogs, getPodEvents, getPodContainers } from '../api/pod';
import YamlEditor from '../components/YamlEditor.vue';
import {
  podReadTime,
  podSectionTab,
  useRoutedPodDetail,
} from './use-pod-detail';

// 与路由缓存 include 名称一致，保留本 Pod 页签的成功资料。Match the route cache include name to retain successful data in this Pod tab.
defineOptions({ name: 'K8sPodDetail' });

const router = useRouter();
const reader = useRoutedPodDetail({
  getPod,
  getPodContainers,
  getPodEvents,
  getPodLogs,
});
// 身份固定到当前缓存实例，不能跟随其他页面的全局路由变化。Keep identity fixed to this cached instance instead of following other pages' global route changes.
const { clusterId, namespace, podName } = reader.identity;
const {
  podState,
  containerState,
  eventState,
  logState,
  selectedContainer,
  targetError,
  mainContainers,
  refreshPod,
  refreshContainers,
  refreshEvents,
  refreshLogs: fetchLogs,
  refresh: fetchData,
} = reader;
// 各分区保留独立资料，附属读取失败不隐藏主资料。Keep each section independent so auxiliary failures never hide primary data.
const podInfo = computed(() => podState.value.data);
const containers = computed(() => containerState.value.data ?? []);
const events = computed(() => eventState.value.data ?? []);
const containerTab = computed(() =>
  podSectionTab('容器', containerState.value, containers.value.length),
);
const eventTab = computed(() =>
  podSectionTab('事件', eventState.value, events.value.length),
);
const activeTab = ref('info');

const statusColorMap: Record<string, string> = {
  Running: 'green',
  Succeeded: 'blue',
  Pending: 'orange',
  Failed: 'red',
  Waiting: 'orange',
  Terminated: 'red',
};

const containerColumns = [
  { title: '容器名', dataIndex: 'name', key: 'name' },
  { title: '镜像', dataIndex: 'image', key: 'image', ellipsis: true },
  { title: '状态', key: 'state', width: 100 },
  { title: '就绪', key: 'ready', width: 60 },
  { title: '重启', dataIndex: 'restartCount', key: 'restartCount', width: 60 },
  { title: '端口', key: 'ports', width: 160 },
];

const eventColumns = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '原因', dataIndex: 'reason', key: 'reason', width: 140 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '次数', dataIndex: 'count', key: 'count', width: 60 },
  {
    title: '时间',
    dataIndex: 'lastTimestamp',
    key: 'lastTimestamp',
    width: 180,
  },
];

/** 切换合法容器并立即隔离旧容器日志。Switch valid containers and immediately isolate previous container logs. */
function handleContainerChange(value: SelectValue) {
  if (typeof value === 'string') reader.selectContainer(value);
}

/** 打开日志页时按当前容器读取；其他标签不发日志请求。Read the selected container on the log tab without requesting logs from other tabs. */
function handleTabChange(key: string | number) {
  activeTab.value = String(key);
  reader.setLogsActive(key === 'logs');
}

/** 返回当前集群及命名空间的原 Pod 列表。Return to the original Pod list for the current cluster and namespace. */
function goBack() {
  const query: Record<string, string> = {};
  if (Number.isSafeInteger(clusterId) && clusterId > 0)
    query.clusterId = String(clusterId);
  if (namespace) query.namespace = namespace;
  router.push({ path: '/K8S/pod/list', query });
}

/** 为事件快照保留按行区分的键，允许同类事件重复出现。Keep distinct row keys within an event snapshot, including repeated event kinds. */
function eventRowKey(record: K8sEvent, index?: number): string {
  return `${record.name}:${record.reason}:${record.lastTimestamp}:${index ?? 0}`;
}
</script>

<template>
  <BusinessPage
    title="Pod详情"
    description="将状态、配置与关联资料放在一起，继续处理当前资源。"
    family="详情"
    route-key="/K8S/pod/detail/:clusterId/:namespace/:podName"
  >
    <div class="p-4">
      <div>
        <!-- 顶部 -->
        <header class="aiops-resource-header">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <div>
              <h2>{{ podName }}</h2>
              <Space class="mt-1">
                <Tag
                  :color="statusColorMap[podInfo?.status || ''] || 'default'"
                  >{{ podInfo?.status || '-' }}</Tag
                >
                <Tag v-if="podState.error" color="red">基本资料读取失败</Tag>
                <Tag v-else-if="podState.stale" color="orange">上次读取</Tag>
                <span style="color: #8c8c8c">{{ namespace }}</span>
                <span v-if="podInfo?.nodeName" style="color: #8c8c8c"
                  >节点: {{ podInfo.nodeName }}</span
                >
              </Space>
            </div>
            <Space>
              <Button
                :disabled="Boolean(targetError)"
                @click="
                  router.push(
                    `/K8S/terminal/index?clusterId=${clusterId}&namespace=${namespace}&podName=${podName}`,
                  )
                "
                >终端</Button
              >
              <Button :disabled="Boolean(targetError)" @click="fetchData"
                >刷新</Button
              >
              <Button @click="goBack">返回列表</Button>
            </Space>
          </div>
        </header>

        <Alert
          v-if="targetError"
          type="error"
          show-icon
          message="Pod 地址参数无效"
          :description="targetError"
        />
        <Tabs
          v-else
          v-model:activeKey="activeTab"
          class="aiops-resource-tabs"
          @change="handleTabChange"
        >
          <!-- 基本信息 -->
          <TabPane key="info" tab="基本信息">
            <Card title="Pod属性" class="mb-4">
              <template #extra
                ><Button
                  size="small"
                  :loading="podState.pending"
                  @click="refreshPod"
                  >刷新资料</Button
                ></template
              >
              <Alert
                v-if="podState.error"
                type="error"
                show-icon
                class="mb-3"
                message="基本资料读取失败"
                :description="podState.error"
              />
              <p v-if="podState.stale" class="pod-read-note">
                上次读取 {{ podReadTime(podState.readAt) }} ·
                当前显示最近成功资料
              </p>
              <Spin :spinning="podState.pending">
                <Descriptions v-if="podInfo" bordered :column="2" size="small">
                  <DescriptionsItem label="名称">{{
                    podInfo?.name
                  }}</DescriptionsItem>
                  <DescriptionsItem label="命名空间">{{
                    podInfo?.namespace
                  }}</DescriptionsItem>
                  <DescriptionsItem label="状态">
                    <Tag
                      :color="
                        statusColorMap[podInfo?.status || ''] || 'default'
                      "
                      >{{ podInfo?.status }}</Tag
                    >
                  </DescriptionsItem>
                  <DescriptionsItem label="就绪">{{
                    podInfo?.ready
                  }}</DescriptionsItem>
                  <DescriptionsItem label="重启次数">{{
                    podInfo?.restarts
                  }}</DescriptionsItem>
                  <DescriptionsItem label="Pod IP">{{
                    podInfo?.podIP || '-'
                  }}</DescriptionsItem>
                  <DescriptionsItem label="Host IP">{{
                    podInfo?.hostIP || '-'
                  }}</DescriptionsItem>
                  <DescriptionsItem label="节点"
                    ><a
                      v-if="podInfo?.nodeName"
                      @click="
                        router.push(
                          `/K8S/node/detail/${clusterId}/${podInfo.nodeName}`,
                        )
                      "
                      >{{ podInfo.nodeName }}</a
                    ><span v-else>-</span></DescriptionsItem
                  >
                  <DescriptionsItem label="服务账户">{{
                    podInfo?.serviceAccount || '-'
                  }}</DescriptionsItem>
                  <DescriptionsItem label="重启策略">{{
                    podInfo?.restartPolicy || '-'
                  }}</DescriptionsItem>
                  <DescriptionsItem label="DNS策略">{{
                    podInfo?.dnsPolicy || '-'
                  }}</DescriptionsItem>
                  <DescriptionsItem label="创建时间">{{
                    podInfo?.createdAt || '-'
                  }}</DescriptionsItem>
                </Descriptions>
                <Empty
                  v-else
                  :description="
                    podState.error ? '基本资料未能读取' : '正在读取基本资料'
                  "
                />
              </Spin>
            </Card>

            <!-- 所属工作负载 -->
            <Card
              v-if="podInfo?.ownerReferences?.length"
              title="所属工作负载"
              class="mb-4"
            >
              <Space>
                <Tag
                  v-for="owner in podInfo.ownerReferences"
                  :key="owner.name"
                  color="blue"
                  style="cursor: pointer"
                  @click="
                    router.push(
                      `/K8S/workload/detail/${clusterId}/${namespace}/${owner.kind}/${owner.name}`,
                    )
                  "
                >
                  {{ owner.kind }}/{{ owner.name }}
                </Tag>
              </Space>
            </Card>

            <!-- 条件 -->
            <Card v-if="podInfo?.conditions?.length" title="条件" class="mb-4">
              <Table
                :data-source="podInfo.conditions"
                :pagination="false"
                row-key="type"
                size="small"
              >
                <Table.Column title="类型" dataIndex="type" />
                <Table.Column title="状态" dataIndex="status">
                  <template #default="{ record }">
                    <Tag :color="record.status === 'True' ? 'green' : 'red'">{{
                      record.status
                    }}</Tag>
                  </template>
                </Table.Column>
                <Table.Column title="原因" dataIndex="reason" />
                <Table.Column title="时间" dataIndex="lastTransitionTime" />
              </Table>
            </Card>
          </TabPane>

          <!-- 容器 -->
          <TabPane key="containers" :tab="containerTab">
            <Card>
              <div class="pod-read-toolbar">
                <span>容器资料</span
                ><Button
                  size="small"
                  :loading="containerState.pending"
                  @click="refreshContainers"
                  >刷新容器</Button
                >
              </div>
              <Alert
                v-if="containerState.error"
                type="error"
                show-icon
                class="mb-3"
                message="容器读取失败"
                :description="containerState.error"
              />
              <p v-if="containerState.stale" class="pod-read-note">
                上次读取 {{ podReadTime(containerState.readAt) }} ·
                当前显示最近成功资料
              </p>
              <Table
                v-if="containerState.data !== null"
                :loading="containerState.pending"
                :columns="containerColumns"
                :data-source="containers"
                :pagination="false"
                row-key="name"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'state'">
                    <Tag :color="statusColorMap[record.state] || 'default'">{{
                      record.state || '-'
                    }}</Tag>
                  </template>
                  <template v-if="column.key === 'ready'">
                    <Tag :color="record.ready ? 'green' : 'red'">{{
                      record.ready ? '是' : '否'
                    }}</Tag>
                  </template>
                  <template v-if="column.key === 'ports'">
                    <span v-if="record.ports && record.ports.length > 0">
                      <Tag
                        v-for="(p, idx) in record.ports"
                        :key="idx"
                        size="small"
                      >
                        {{ p.containerPort }}/{{ p.protocol || 'TCP' }}
                      </Tag>
                    </span>
                    <span v-else>-</span>
                  </template>
                </template>
              </Table>
              <Spin v-else :spinning="containerState.pending"
                ><Empty
                  :description="
                    containerState.error
                      ? '容器资料未能读取'
                      : '正在读取容器资料'
                  "
              /></Spin>
            </Card>
          </TabPane>

          <!-- 日志 -->
          <TabPane key="logs" tab="日志">
            <Card>
              <div style="margin-bottom: 12px">
                <Space>
                  <span style="color: #8c8c8c">容器:</span>
                  <Select
                    :value="selectedContainer"
                    :loading="containerState.pending"
                    :disabled="mainContainers.length === 0"
                    aria-label="日志容器"
                    style="width: 200px"
                    @change="handleContainerChange"
                  >
                    <SelectOption
                      v-for="c in mainContainers"
                      :key="c.name"
                      :value="c.name"
                    >
                      {{ c.name }}
                    </SelectOption>
                  </Select>
                  <Button
                    :loading="logState.pending"
                    :disabled="!selectedContainer"
                    @click="fetchLogs"
                    >刷新日志</Button
                  >
                </Space>
              </div>
              <Alert
                v-if="containerState.error"
                type="warning"
                show-icon
                class="mb-3"
                message="容器列表读取失败"
                description="可返回容器页刷新；已有容器选择来自上次成功读取。"
              />
              <Alert
                v-if="logState.error"
                type="error"
                show-icon
                class="mb-3"
                message="日志读取失败"
                :description="logState.error"
              />
              <p v-if="logState.stale" class="pod-read-note">
                上次读取 {{ podReadTime(logState.readAt) }} ·
                当前显示最近成功日志
              </p>
              <Spin :spinning="logState.pending">
                <pre
                  v-if="logState.data !== null"
                  style="
                    max-height: 500px;
                    overflow: auto;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 16px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    word-break: break-all;
                  "
                  >{{ logState.data || '暂无日志' }}</pre
                >
                <Empty
                  v-else
                  :description="
                    logState.error
                      ? '日志未能读取'
                      : selectedContainer
                        ? '正在读取日志'
                        : '请先读取并选择普通容器'
                  "
                />
              </Spin>
            </Card>
          </TabPane>

          <!-- 事件 -->
          <TabPane key="events" :tab="eventTab">
            <Card>
              <div class="pod-read-toolbar">
                <span>事件记录</span
                ><Button
                  size="small"
                  :loading="eventState.pending"
                  @click="refreshEvents"
                  >刷新事件</Button
                >
              </div>
              <Alert
                v-if="eventState.error"
                type="error"
                show-icon
                class="mb-3"
                message="事件读取失败"
                :description="eventState.error"
              />
              <p v-if="eventState.stale" class="pod-read-note">
                上次读取 {{ podReadTime(eventState.readAt) }} ·
                当前显示最近成功资料
              </p>
              <Table
                v-if="eventState.data !== null"
                :loading="eventState.pending"
                :columns="eventColumns"
                :data-source="events"
                :pagination="false"
                :row-key="eventRowKey"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'type'">
                    <Tag
                      :color="record.type === 'Warning' ? 'orange' : 'blue'"
                      >{{ record.type }}</Tag
                    >
                  </template>
                </template>
              </Table>
              <Spin v-else :spinning="eventState.pending"
                ><Empty
                  :description="
                    eventState.error ? '事件记录未能读取' : '正在读取事件记录'
                  "
              /></Spin>
            </Card>
          </TabPane>

          <!-- Volumes -->
          <TabPane
            v-if="podInfo?.volumes?.length"
            key="volumes"
            :tab="`存储卷 (${podInfo?.volumes?.length || 0})`"
          >
            <Card>
              <Alert
                v-if="podState.error"
                type="error"
                show-icon
                class="mb-3"
                message="基本资料读取失败，存储卷尚未更新"
                :description="podState.error"
              />
              <p v-if="podState.stale" class="pod-read-note">
                上次读取 {{ podReadTime(podState.readAt) }} ·
                当前显示最近成功资料
              </p>
              <Table
                :data-source="podInfo.volumes"
                :pagination="false"
                row-key="name"
                size="small"
              >
                <Table.Column title="名称" dataIndex="name" />
                <Table.Column title="类型" dataIndex="type">
                  <template #default="{ record }">
                    <Tag>{{ record.type }}</Tag>
                  </template>
                </Table.Column>
                <Table.Column title="详情">
                  <template #default="{ record }">
                    <span v-if="record.claimName"
                      >PVC: {{ record.claimName }}</span
                    >
                    <span v-else-if="record.path">路径: {{ record.path }}</span>
                    <span v-else>-</span>
                  </template>
                </Table.Column>
              </Table>
            </Card>
          </TabPane>

          <!-- YAML -->
          <TabPane key="yaml" tab="YAML">
            <Card>
              <div class="pod-read-toolbar">
                <span>Pod YAML</span
                ><Button
                  size="small"
                  :loading="podState.pending"
                  @click="refreshPod"
                  >刷新资料</Button
                >
              </div>
              <Alert
                v-if="podState.error"
                type="error"
                show-icon
                class="mb-3"
                message="基本资料读取失败，YAML 尚未更新"
                :description="podState.error"
              />
              <p v-if="podState.stale" class="pod-read-note">
                上次读取 {{ podReadTime(podState.readAt) }} ·
                当前显示最近成功资料
              </p>
              <YamlEditor
                v-if="podInfo"
                :model-value="podInfo?.yaml || ''"
                :read-only="true"
                height="600px"
              />
              <Spin v-else :spinning="podState.pending"
                ><Empty
                  :description="
                    podState.error ? 'YAML 未能读取' : '正在读取 YAML'
                  "
              /></Spin>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </BusinessPage>
</template>

<style scoped>
.pod-read-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.pod-read-note {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
  margin: 0 0 12px;
}
</style>
