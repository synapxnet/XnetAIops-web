<script lang="ts" setup>
const capabilities = [
  ['统一运维视图', '集中呈现主机、集群、服务、监控、Kubernetes 与镜像仓库。'],
  ['企业多租户', '通过用户、角色和权限边界支撑多团队协作与平台治理。'],
  ['前后端分离', '独立的 Web 控制台与微服务后端便于扩展、集成和按需部署。'],
  ['持续演进', '围绕自动化交付、可观测性和智能运维场景持续维护更新。'],
];

const links = [
  ['在线体验', 'https://www.xnetaiops.synapxnet.cn'],
  ['前端仓库', 'https://github.com/synapxnet/XnetAIops-web'],
  ['后端仓库', 'https://github.com/synapxnet/XnetAIops'],
  ['OpenXnet', 'https://openxnet.synapxnet.com'],
];

defineOptions({ name: 'SynapXnetAbout' });
</script>

<template>
  <div class="bg-background min-h-full">
    <header class="bg-card border-b px-6 py-8 lg:px-10">
      <div class="mx-auto max-w-6xl">
        <div class="mb-3 flex flex-wrap items-center gap-3">
          <span class="text-muted-foreground text-sm font-medium"
            >SynapXnet 开源项目</span
          >
          <span
            class="border-border bg-background rounded border px-2 py-0.5 text-xs font-semibold"
            >v1.0.0</span
          >
        </div>
        <h1 class="text-foreground text-3xl font-semibold">XnetAIops</h1>
        <p class="text-muted-foreground mt-3 max-w-3xl text-base leading-7">
          面向基础设施、服务与 Kubernetes
          的企业级多租户智能运维平台，采用前后端分离和模块化微服务架构。
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8 lg:px-10">
      <section>
        <h2 class="text-foreground text-lg font-semibold">平台优势</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <article
            v-for="([title, description], index) in capabilities"
            :key="index"
            class="border-border bg-card rounded-md border p-5"
          >
            <h3 class="text-foreground text-sm font-semibold">{{ title }}</h3>
            <p class="text-muted-foreground mt-2 text-sm leading-6">
              {{ description }}
            </p>
          </article>
        </div>
      </section>

      <section class="border-border mt-10 border-t pt-8">
        <h2 class="text-foreground text-lg font-semibold">项目链接</h2>
        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <a
            v-for="([label, href], index) in links"
            :key="index"
            :href="href"
            class="text-primary hover:text-primary/80 text-sm font-medium"
            rel="noreferrer"
            target="_blank"
          >
            {{ label }} ↗
          </a>
        </div>
      </section>

      <section class="border-border mt-10 border-t pt-8">
        <h2 class="text-foreground text-lg font-semibold">开源与框架</h2>
        <p class="text-muted-foreground mt-3 max-w-4xl text-sm leading-6">
          XnetAIops Web 基于 MIT License 开源，前端采用
          <a
            class="text-primary hover:text-primary/80 font-medium"
            href="https://github.com/vbenjs/vue-vben-admin"
            rel="noreferrer"
            target="_blank"
            >Vue Vben Admin</a
          >
          框架构建，并依法保留上游项目的版权与许可声明。
        </p>
        <p class="text-muted-foreground mt-3 text-sm">
          Copyright © 2026 SynapXnet
        </p>
      </section>
    </main>
  </div>
</template>
