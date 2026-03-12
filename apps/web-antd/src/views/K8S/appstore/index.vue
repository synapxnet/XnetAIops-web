<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Input, Select, SelectOption, Space, Button, Tag, Row, Col, message, Segmented, Spin } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { searchHelmApps, getHelmRepos, getAppTemplates, getAppCategories, getAppFeatured } from '../api/helm';
import type { K8sCluster } from '../api/types';

const router = useRouter();

// Mode: 'templates' or 'helm'
const mode = ref<'templates' | 'helm'>('templates');

// Shared state
const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);

// Template mode
const templates = ref<any[]>([]);
const featuredTemplates = ref<any[]>([]);
const categories = ref<string[]>([]);
const selectedCategory = ref<string>('');

const categoryLabels: Record<string, string> = {
  '': '全部',
  database: '数据库',
  middleware: '中间件',
  messaging: '消息队列',
  storage: '存储',
  devops: 'DevOps',
  monitoring: '监控',
};

// Helm mode
const repos = ref<any[]>([]);
const selectedRepoId = ref<number | undefined>(undefined);
const keyword = ref('');
const apps = ref<any[]>([]);

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter(c => c.status === 'active');
    if (active.length > 0) {
      selectedClusterId.value = active[0]!.id;
      if (mode.value === 'helm') fetchRepos();
    }
  } catch { message.error('获取集群列表失败'); }
}

// ====== Template mode ======
async function fetchTemplates() {
  loading.value = true;
  try {
    const res = await getAppTemplates(selectedCategory.value || undefined);
    templates.value = Array.isArray(res) ? res : [];
  } catch { message.error('获取应用模板失败'); }
  finally { loading.value = false; }
}

async function fetchFeatured() {
  try {
    const res = await getAppFeatured();
    featuredTemplates.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function fetchCategories() {
  try {
    const res = await getAppCategories();
    categories.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

function selectCategory(cat: string) {
  selectedCategory.value = cat;
  fetchTemplates();
}

function goTemplateInstall(tpl: any) {
  router.push({
    path: '/K8S/appstore/template-install',
    query: { templateId: tpl.id },
  });
}

// ====== Helm mode ======
async function fetchRepos() {
  if (!selectedClusterId.value) return;
  try {
    const res = await getHelmRepos(selectedClusterId.value);
    repos.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
  fetchApps();
}

async function fetchApps() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await searchHelmApps(selectedClusterId.value, keyword.value || undefined, selectedRepoId.value);
    apps.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('搜索应用失败: ' + e.message); }
  finally { loading.value = false; }
}

function goDetail(app: any) {
  router.push({
    path: '/K8S/appstore/detail',
    query: { clusterId: selectedClusterId.value!, repoId: app.repoId || selectedRepoId.value, chartName: app.name },
  });
}

function onModeChange(val: string | number) {
  mode.value = val as 'templates' | 'helm';
  if (val === 'templates') {
    fetchTemplates();
    fetchFeatured();
  } else {
    fetchRepos();
  }
}

onMounted(() => {
  fetchClusters();
  fetchCategories();
  fetchTemplates();
  fetchFeatured();
});
</script>

<template>
  <div class="p-4">
    <!-- Banner -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:8px;padding:40px 32px;margin-bottom:24px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1 style="margin:0;font-size:28px;font-weight:600">应用商店</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px">
            基于 Helm Chart 的应用管理平台，一键部署常用中间件和服务
          </p>
        </div>
        <Space>
          <Button type="primary" ghost @click="router.push('/K8S/appstore/releases')">已安装应用</Button>
          <Button ghost @click="router.push('/K8S/appstore/repos')">Helm 仓库</Button>
          <Segmented
            :value="mode"
            :options="[{ label: '模板商店', value: 'templates' }, { label: 'Helm 仓库', value: 'helm' }]"
            @change="onModeChange"
            style="background:rgba(255,255,255,0.15)"
          />
        </Space>
      </div>

      <!-- Featured apps banner (template mode) -->
      <div v-if="mode === 'templates' && featuredTemplates.length > 0" style="margin-top:24px;display:flex;gap:16px;overflow-x:auto">
        <div
          v-for="ft in featuredTemplates" :key="ft.id"
          @click="goTemplateInstall(ft)"
          style="flex-shrink:0;background:rgba(255,255,255,0.1);border-radius:8px;padding:16px 20px;cursor:pointer;display:flex;align-items:center;gap:12px;min-width:200px;transition:background 0.2s"
          @mouseenter="($event.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.2)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.1)'"
        >
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <img v-if="ft.icon" :src="ft.icon" style="width:28px;height:28px;object-fit:contain" />
            <span v-else style="font-size:18px;font-weight:bold;color:#fff">{{ (ft.displayName || ft.name || '?')[0] }}</span>
          </div>
          <div>
            <div style="font-weight:600;font-size:14px">{{ ft.displayName }}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px">{{ categoryLabels[ft.category] || ft.category }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Mode -->
    <template v-if="mode === 'templates'">
      <div style="display:flex;gap:24px">
        <!-- Category sidebar -->
        <div style="width:160px;flex-shrink:0">
          <Card size="small" :bodyStyle="{ padding: '8px 0' }">
            <div
              v-for="cat in ['', ...categories]" :key="cat"
              @click="selectCategory(cat)"
              :style="{
                padding: '10px 20px',
                cursor: 'pointer',
                background: selectedCategory === cat ? '#e6f7ff' : 'transparent',
                color: selectedCategory === cat ? '#1890ff' : '#333',
                fontWeight: selectedCategory === cat ? '600' : '400',
                borderRight: selectedCategory === cat ? '3px solid #1890ff' : '3px solid transparent',
                fontSize: '14px',
                transition: 'all 0.2s',
              }"
            >
              {{ categoryLabels[cat] || cat }}
            </div>
          </Card>
        </div>

        <!-- Template grid -->
        <div style="flex:1">
          <Spin :spinning="loading">
            <Row :gutter="[16, 16]">
              <Col v-for="tpl in templates" :key="tpl.id" :xs="24" :sm="12" :md="8" :lg="8">
                <Card hoverable @click="goTemplateInstall(tpl)" style="cursor:pointer;height:100%">
                  <div style="display:flex;align-items:center;margin-bottom:12px">
                    <div style="width:48px;height:48px;border-radius:8px;background:#f0f5ff;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0">
                      <img v-if="tpl.icon" :src="tpl.icon" style="width:36px;height:36px;object-fit:contain" />
                      <span v-else style="font-size:20px;color:#1890ff;font-weight:bold">{{ (tpl.displayName || tpl.name || '?')[0] }}</span>
                    </div>
                    <div style="overflow:hidden">
                      <div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ tpl.displayName }}</div>
                      <Tag size="small" :color="
                        tpl.category === 'database' ? 'blue' :
                        tpl.category === 'middleware' ? 'orange' :
                        tpl.category === 'messaging' ? 'purple' :
                        tpl.category === 'storage' ? 'cyan' :
                        tpl.category === 'devops' ? 'green' :
                        tpl.category === 'monitoring' ? 'red' : 'default'
                      ">{{ categoryLabels[tpl.category] || tpl.category }}</Tag>
                    </div>
                  </div>
                  <div style="font-size:12px;color:#595959;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:34px">
                    {{ tpl.description || '暂无描述' }}
                  </div>
                  <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:11px;color:#8c8c8c">{{ tpl.helmRepoName }}/{{ tpl.chartName }}</span>
                    <Tag v-if="tpl.isFeatured" color="gold" size="small">推荐</Tag>
                  </div>
                </Card>
              </Col>
            </Row>
            <div v-if="templates.length === 0 && !loading" style="text-align:center;color:#8c8c8c;padding:60px">
              暂无应用模板
            </div>
          </Spin>
        </div>
      </div>
    </template>

    <!-- Helm Mode (original) -->
    <template v-else>
      <Card class="mb-4">
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchRepos(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Select v-model:value="selectedRepoId" style="width:180px" placeholder="全部仓库" allowClear @change="fetchApps">
            <SelectOption v-for="r in repos" :key="r.id" :value="r.id">{{ r.name }}</SelectOption>
          </Select>
          <Input.Search v-model:value="keyword" placeholder="搜索应用..." style="width:300px" @search="fetchApps" allowClear />
          <Button @click="fetchApps" :loading="loading">刷新</Button>
        </Space>
      </Card>

      <Row :gutter="[16, 16]">
        <Col v-for="app in apps" :key="app.name" :xs="24" :sm="12" :md="8" :lg="6">
          <Card hoverable @click="goDetail(app)" style="cursor:pointer;height:100%">
            <div style="display:flex;align-items:center;margin-bottom:12px">
              <div style="width:48px;height:48px;border-radius:8px;background:#f0f5ff;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0">
                <img v-if="app.icon" :src="app.icon" style="width:36px;height:36px;object-fit:contain" />
                <span v-else style="font-size:20px;color:#1890ff;font-weight:bold">{{ (app.name || '?')[0].toUpperCase() }}</span>
              </div>
              <div style="overflow:hidden">
                <div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ app.name }}</div>
                <div style="font-size:12px;color:#8c8c8c">v{{ app.version }}</div>
              </div>
            </div>
            <div style="font-size:12px;color:#595959;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:34px">
              {{ app.description || '暂无描述' }}
            </div>
            <div style="margin-top:8px">
              <Tag v-if="app.repoName" size="small" color="blue">{{ app.repoName }}</Tag>
              <Tag v-for="kw in (app.keywords || []).slice(0, 2)" :key="kw" size="small">{{ kw }}</Tag>
            </div>
          </Card>
        </Col>
      </Row>
      <div v-if="apps.length === 0 && !loading" style="text-align:center;color:#8c8c8c;padding:60px">
        暂无应用（请先添加 Helm 仓库并同步）
      </div>
    </template>
  </div>
</template>
