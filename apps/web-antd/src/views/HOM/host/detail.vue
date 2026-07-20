<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Descriptions, DescriptionsItem, Tag, Button, Progress, message } from 'ant-design-vue';
import { getHost } from '../api/host';
import type { Host } from '../api/types';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const host = ref<Host | null>(null);

const statusColorMap: Record<string, string> = {
  online: 'green', offline: 'default', error: 'red', unknown: 'orange',
};

function memPercent() {
  if (!host.value?.totalMemGb || host.value.totalMemGb === 0) return 0;
  return Math.round((Number(host.value.usedMemGb) / Number(host.value.totalMemGb)) * 100);
}

function diskPercent() {
  if (!host.value?.totalDiskGb || host.value.totalDiskGb === 0) return 0;
  return Math.round((Number(host.value.usedDiskGb) / Number(host.value.totalDiskGb)) * 100);
}

async function fetchData() {
  const id = Number(route.params.id);
  loading.value = true;
  try {
    const res = await getHost(id);
    host.value = (res as any)?.data || res;
  } catch (e: any) {
    message.error('获取主机详情失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/HOM/host/list');
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <Card :loading="loading">
      <template #title>
        <Button type="link" @click="goBack" style="padding-left: 0">← 返回列表</Button>
        <span v-if="host">{{ host.hostname }} ({{ host.ipAddress }})</span>
      </template>
      <template v-if="host">
        <Descriptions bordered :column="2">
          <DescriptionsItem label="主机名">{{ host.hostname }}</DescriptionsItem>
          <DescriptionsItem label="IP地址">{{ host.ipAddress }}</DescriptionsItem>
          <DescriptionsItem label="SSH端口">{{ host.sshPort }}</DescriptionsItem>
          <DescriptionsItem label="SSH用户">{{ host.sshUser }}</DescriptionsItem>
          <DescriptionsItem label="操作系统">{{ host.osType || '-' }} {{ host.osVersion || '' }}</DescriptionsItem>
          <DescriptionsItem label="CPU架构">{{ host.cpuArch || '-' }}</DescriptionsItem>
          <DescriptionsItem label="CPU核数">{{ host.cpuCores || '-' }}</DescriptionsItem>
          <DescriptionsItem label="CPU使用率">
            <Progress :percent="Number(host.cpuUsage || 0)" size="small" />
          </DescriptionsItem>
          <DescriptionsItem label="内存">
            {{ host.usedMemGb || 0 }} / {{ host.totalMemGb || 0 }} GB
            <Progress :percent="memPercent()" size="small" style="margin-top: 4px" />
          </DescriptionsItem>
          <DescriptionsItem label="磁盘">
            {{ host.usedDiskGb || 0 }} / {{ host.totalDiskGb || 0 }} GB
            <Progress :percent="diskPercent()" size="small" style="margin-top: 4px" />
          </DescriptionsItem>
          <DescriptionsItem label="机架">{{ host.rack || '-' }}</DescriptionsItem>
          <DescriptionsItem label="节点标签">{{ host.nodeLabel || '-' }}</DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="statusColorMap[host.status] || 'default'">{{ host.status }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="Agent状态">
            <Tag :color="host.agentStatus === 'running' ? 'green' : 'default'">{{ host.agentStatus }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="最后心跳">{{ host.lastHeartbeat || '-' }}</DescriptionsItem>
          <DescriptionsItem label="创建时间">{{ host.createdAt }}</DescriptionsItem>
        </Descriptions>
      </template>
    </Card>
  </div>
</template>
