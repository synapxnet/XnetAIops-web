<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { PAGE_REQUEST_EVENT } from '../design/request-state';
import type { PageRequestState } from '../design/request-state';
const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    family: string;
    routeKey: string;
    showHeading?: boolean;
  }>(),
  { showHeading: true },
);
const route = useRoute();
const requestError = ref('');
const failedRequests = new Map<string, string>();
/** 只接受本页请求事件，不让迟到错误覆盖新页面。Accept only this page's request events and ignore stale route errors. */
function requestChanged(event: Event): void {
  const detail = (event as CustomEvent<PageRequestState>).detail;
  if (detail?.route !== route.fullPath) return;
  if (detail.failed) failedRequests.set(detail.requestKey, detail.message);
  else failedRequests.delete(detail.requestKey);
  requestError.value = [...new Set(failedRequests.values())].join(' ');
}
/** 路由改变后清理旧提示，保留页面自身表单生命周期。Clear old notices when routing without changing form lifecycles. */
function resetNotice(): void {
  failedRequests.clear();
  requestError.value = '';
}
watch(() => route.fullPath, resetNotice);
/** 订阅全局请求边界。Subscribe to the global request boundary. */
function connect(): void {
  window.addEventListener(PAGE_REQUEST_EVENT, requestChanged);
}
/** 离页释放监听。Release the listener on unmount. */
function disconnect(): void {
  window.removeEventListener(PAGE_REQUEST_EVENT, requestChanged);
}
onMounted(connect);
onBeforeUnmount(disconnect);
</script>
<template>
  <section
    class="aiops-business-page"
    :data-route-key="routeKey"
    :data-page-family="family"
    :aria-label="title"
  >
    <!-- 保留可访问的页面名称，业务标题与操作由原页面呈现。 Keep an accessible page name while the native page owns visible titles and actions. -->
    <h1 v-if="showHeading" class="sr-only">{{ props.title }}</h1>
    <div v-if="requestError" class="aiops-page-error" role="alert">
      <strong>部分资料暂时无法取得</strong>
      <p>{{ requestError }}</p>
      <small>已填写内容仍保留。可使用本页的刷新或查询操作重试。</small
      ><button aria-label="关闭请求提示" @click="resetNotice">×</button>
    </div>
    <div class="aiops-business-content"><slot /></div>
  </section>
</template>
