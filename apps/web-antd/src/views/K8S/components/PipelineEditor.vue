<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Card, Button, Input, Select, Space, Divider, Alert, Tabs, Tooltip } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons-vue';
import JenkinsfileEditor from './JenkinsfileEditor.vue';

// ==================== Types ====================
interface PipelineStep {
  type: 'sh' | 'echo' | 'checkout' | 'script' | 'custom';
  content: string;
}

interface PipelineStage {
  id: string;
  name: string;
  steps: PipelineStep[];
}

interface PipelineConfig {
  agent: string;
  stages: PipelineStage[];
}

// ==================== Props/Model ====================
const props = defineProps<{ initialJenkinsfile?: string }>();
const jenkinsfile = defineModel<string>({ default: '' });

// ==================== State ====================
const editorMode = ref<'visual' | 'code'>('visual');
const selectedStageId = ref<string | null>(null);
const parseWarning = ref('');

const config = ref<PipelineConfig>({
  agent: 'any',
  stages: [],
});

// ==================== Computed ====================
const selectedStage = computed(() =>
  config.value.stages.find(s => s.id === selectedStageId.value) || null
);

// ==================== Jenkinsfile Generation ====================
function generateJenkinsfile(cfg: PipelineConfig): string {
  const lines: string[] = ['pipeline {', `  agent ${cfg.agent || 'any'}`, '  stages {'];
  for (const stage of cfg.stages) {
    lines.push(`    stage('${stage.name}') {`);
    lines.push('      steps {');
    for (const step of stage.steps) {
      if (step.type === 'sh') {
        const content = step.content.includes('\n')
          ? `sh """\n${step.content.split('\n').map(l => '          ' + l).join('\n')}\n        """`
          : `sh '${step.content.replace(/'/g, "\\'")}'`;
        lines.push(`        ${content}`);
      } else if (step.type === 'echo') {
        lines.push(`        echo '${step.content.replace(/'/g, "\\'")}'`);
      } else if (step.type === 'checkout') {
        lines.push('        checkout scm');
      } else if (step.type === 'script') {
        lines.push(`        script {`);
        step.content.split('\n').forEach(l => lines.push(`          ${l}`));
        lines.push('        }');
      } else {
        lines.push(`        ${step.content}`);
      }
    }
    lines.push('      }');
    lines.push('    }');
  }
  lines.push('  }', '}');
  return lines.join('\n');
}

// ==================== Jenkinsfile Parsing ====================
function parseJenkinsfile(text: string): PipelineConfig | null {
  try {
    const cfg: PipelineConfig = { agent: 'any', stages: [] };
    // Extract agent
    const agentMatch = text.match(/agent\s+(\{[^}]*\}|any|none|'[^']*')/);
    if (agentMatch) cfg.agent = agentMatch[1]!;
    // Extract stages
    const stageRegex = /stage\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\{/g;
    let match;
    const stagePositions: { name: string; pos: number }[] = [];
    while ((match = stageRegex.exec(text)) !== null) {
      stagePositions.push({ name: match[1]!, pos: match.index });
    }
    for (let i = 0; i < stagePositions.length; i++) {
      const sp = stagePositions[i]!;
      const endPos = i + 1 < stagePositions.length ? stagePositions[i + 1]!.pos : text.length;
      const stageBody = text.substring(sp.pos, endPos);
      // Extract steps block
      const stepsMatch = stageBody.match(/steps\s*\{([\s\S]*?)\n\s{6}\}/);
      const steps: PipelineStep[] = [];
      if (stepsMatch) {
        const stepsContent = stepsMatch[1]!;
        // Parse sh commands
        const shRegex = /sh\s+['"]([^'"]*)['"]/g;
        let shMatch;
        while ((shMatch = shRegex.exec(stepsContent)) !== null) {
          steps.push({ type: 'sh', content: shMatch[1]! });
        }
        // Parse sh with triple quotes
        const shTripleRegex = /sh\s+"""([\s\S]*?)"""/g;
        while ((shMatch = shTripleRegex.exec(stepsContent)) !== null) {
          steps.push({ type: 'sh', content: shMatch[1]!.trim() });
        }
        // Parse echo
        const echoRegex = /echo\s+['"]([^'"]*)['"]/g;
        let echoMatch;
        while ((echoMatch = echoRegex.exec(stepsContent)) !== null) {
          steps.push({ type: 'echo', content: echoMatch[1]! });
        }
        // Parse checkout
        if (stepsContent.includes('checkout scm')) {
          steps.push({ type: 'checkout', content: 'checkout scm' });
        }
        // If no steps parsed, add the raw content
        if (steps.length === 0 && stepsContent.trim()) {
          steps.push({ type: 'custom', content: stepsContent.trim() });
        }
      }
      cfg.stages.push({
        id: `stage-${Date.now()}-${i}`,
        name: sp.name,
        steps: steps.length > 0 ? steps : [{ type: 'echo', content: `Hello from ${sp.name}` }],
      });
    }
    if (cfg.stages.length === 0) return null;
    return cfg;
  } catch {
    return null;
  }
}

// ==================== Stage Operations ====================
function addStage() {
  const id = `stage-${Date.now()}`;
  config.value.stages.push({
    id,
    name: `Stage ${config.value.stages.length + 1}`,
    steps: [{ type: 'sh', content: 'echo "Hello"' }],
  });
  selectedStageId.value = id;
  syncToJenkinsfile();
}

function removeStage(id: string) {
  config.value.stages = config.value.stages.filter(s => s.id !== id);
  if (selectedStageId.value === id) selectedStageId.value = null;
  syncToJenkinsfile();
}

function moveStage(id: string, direction: 'up' | 'down') {
  const idx = config.value.stages.findIndex(s => s.id === id);
  if (idx < 0) return;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= config.value.stages.length) return;
  const temp = config.value.stages[idx]!;
  config.value.stages[idx] = config.value.stages[target]!;
  config.value.stages[target] = temp;
  syncToJenkinsfile();
}

function addStep() {
  if (!selectedStage.value) return;
  selectedStage.value.steps.push({ type: 'sh', content: '' });
  syncToJenkinsfile();
}

function removeStep(index: number) {
  if (!selectedStage.value) return;
  selectedStage.value.steps.splice(index, 1);
  syncToJenkinsfile();
}

function syncToJenkinsfile() {
  jenkinsfile.value = generateJenkinsfile(config.value);
}

// ==================== Mode Switching ====================
function switchMode(mode: 'visual' | 'code') {
  if (mode === 'code' && editorMode.value === 'visual') {
    // Visual → Code: generate Jenkinsfile from current config
    jenkinsfile.value = generateJenkinsfile(config.value);
  } else if (mode === 'visual' && editorMode.value === 'code') {
    // Code → Visual: try to parse Jenkinsfile
    const parsed = parseJenkinsfile(jenkinsfile.value);
    if (parsed) {
      config.value = parsed;
      parseWarning.value = '';
    } else if (jenkinsfile.value.trim()) {
      parseWarning.value = '当前 Jenkinsfile 包含高级语法，无法完全转换为可视化模式。建议在代码模式下编辑。';
      return; // Stay in code mode
    }
  }
  editorMode.value = mode;
}

// ==================== Templates ====================

// Advanced Jenkinsfile template (code-only, contains environment/credentials/post)
const TEMPLATE_FULLSTACK = `pipeline {
  agent any
  environment {
    // ====== 请修改以下变量 ======
    REGISTRY       = 'your-registry.com'
    IMAGE_FRONTEND = 'myapp-web'
    IMAGE_BACKEND  = 'myapp-api'
    FRONTEND_DIR   = 'XnetMLops-web'
    BACKEND_DIR    = 'mlops-mep-service'
    DEPLOY_FRONTEND = 'myapp-web'
    DEPLOY_BACKEND  = 'myapp-api'
    NAMESPACE       = 'default'
    // ============================
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Frontend Build') {
      steps {
        sh """
          cd \${FRONTEND_DIR}
          npm install --registry=https://registry.npmmirror.com
          npm run build
        """
      }
    }
    stage('Backend Build') {
      steps {
        sh """
          cd \${BACKEND_DIR}
          mvn clean package -DskipTests -q
        """
      }
    }
    stage('Docker Build') {
      steps {
        sh "docker build -t \${REGISTRY}/\${IMAGE_FRONTEND}:\${BUILD_NUMBER} -f \${FRONTEND_DIR}/Dockerfile \${FRONTEND_DIR}"
        sh "docker build -t \${REGISTRY}/\${IMAGE_BACKEND}:\${BUILD_NUMBER} -f \${BACKEND_DIR}/Dockerfile \${BACKEND_DIR}"
      }
    }
    stage('Docker Push') {
      steps {
        sh "docker push \${REGISTRY}/\${IMAGE_FRONTEND}:\${BUILD_NUMBER}"
        sh "docker push \${REGISTRY}/\${IMAGE_BACKEND}:\${BUILD_NUMBER}"
      }
    }
    stage('Deploy to K8S') {
      steps {
        sh "kubectl set image deployment/\${DEPLOY_FRONTEND} app=\${REGISTRY}/\${IMAGE_FRONTEND}:\${BUILD_NUMBER} -n \${NAMESPACE}"
        sh "kubectl set image deployment/\${DEPLOY_BACKEND} app=\${REGISTRY}/\${IMAGE_BACKEND}:\${BUILD_NUMBER} -n \${NAMESPACE}"
        sh "kubectl rollout status deployment/\${DEPLOY_FRONTEND} -n \${NAMESPACE} --timeout=120s"
        sh "kubectl rollout status deployment/\${DEPLOY_BACKEND} -n \${NAMESPACE} --timeout=120s"
      }
    }
  }
  post {
    success { echo 'Pipeline succeeded!' }
    failure { echo 'Pipeline failed!' }
  }
}`;

const templates: { label: string; config: PipelineConfig }[] = [
  {
    label: 'Node.js', config: {
      agent: 'any', stages: [
        { id: 's1', name: 'Checkout', steps: [{ type: 'checkout', content: 'checkout scm' }] },
        { id: 's2', name: 'Install', steps: [{ type: 'sh', content: 'npm install' }] },
        { id: 's3', name: 'Test', steps: [{ type: 'sh', content: 'npm test' }] },
        { id: 's4', name: 'Build', steps: [{ type: 'sh', content: 'npm run build' }] },
      ],
    },
  },
  {
    label: 'Maven', config: {
      agent: 'any', stages: [
        { id: 's1', name: 'Checkout', steps: [{ type: 'checkout', content: 'checkout scm' }] },
        { id: 's2', name: 'Build', steps: [{ type: 'sh', content: 'mvn clean package -DskipTests' }] },
        { id: 's3', name: 'Test', steps: [{ type: 'sh', content: 'mvn test' }] },
        { id: 's4', name: 'Deploy', steps: [{ type: 'sh', content: 'mvn deploy' }] },
      ],
    },
  },
  {
    label: 'Docker', config: {
      agent: 'any', stages: [
        { id: 's1', name: 'Checkout', steps: [{ type: 'checkout', content: 'checkout scm' }] },
        { id: 's2', name: 'Build Image', steps: [{ type: 'sh', content: 'docker build -t myapp:latest .' }] },
        { id: 's3', name: 'Push Image', steps: [{ type: 'sh', content: 'docker push myapp:latest' }] },
      ],
    },
  },
  {
    label: '通用', config: {
      agent: 'any', stages: [
        { id: 's1', name: 'Hello', steps: [{ type: 'echo', content: 'Hello Pipeline!' }] },
      ],
    },
  },
];

function applyFullstackTemplate() {
  jenkinsfile.value = TEMPLATE_FULLSTACK;
  editorMode.value = 'code';
  parseWarning.value = '';
}

function applyTemplate(tpl: typeof templates[0]) {
  // Deep clone template with unique IDs
  config.value = {
    agent: tpl.config.agent,
    stages: tpl.config.stages.map((s, i) => ({
      ...s, id: `stage-${Date.now()}-${i}`,
      steps: s.steps.map(st => ({ ...st })),
    })),
  };
  selectedStageId.value = config.value.stages[0]?.id || null;
  syncToJenkinsfile();
}

// ==================== Init ====================
function init() {
  if (props.initialJenkinsfile) {
    const parsed = parseJenkinsfile(props.initialJenkinsfile);
    if (parsed) {
      config.value = parsed;
      jenkinsfile.value = props.initialJenkinsfile;
    } else {
      jenkinsfile.value = props.initialJenkinsfile;
      editorMode.value = 'code';
      parseWarning.value = '当前 Jenkinsfile 使用高级语法，已切换到代码模式。';
    }
  }
}
init();

// Watch for step/name changes to sync
watch(() => config.value.stages.map(s => ({ name: s.name, steps: JSON.stringify(s.steps) })),
  () => { if (editorMode.value === 'visual') syncToJenkinsfile(); },
  { deep: true },
);

const stepTypeOptions = [
  { label: 'Shell 命令', value: 'sh' },
  { label: 'Echo 输出', value: 'echo' },
  { label: '检出代码', value: 'checkout' },
  { label: 'Groovy 脚本', value: 'script' },
  { label: '自定义', value: 'custom' },
];
</script>

<template>
  <div class="pipeline-editor">
    <!-- Mode Tabs + Templates -->
    <div class="editor-toolbar">
      <div class="editor-tabs">
        <div :class="['editor-tab', { active: editorMode === 'visual' }]" @click="switchMode('visual')">
          可视化编辑
        </div>
        <div :class="['editor-tab', { active: editorMode === 'code' }]" @click="switchMode('code')">
          Jenkinsfile
        </div>
      </div>
      <Space>
        <span style="color: #8c8c8c; font-size: 12px">快速模板:</span>
        <Button size="small" type="primary" ghost @click="applyFullstackTemplate">
          前后端分离
        </Button>
        <Button v-for="tpl in templates" :key="tpl.label" size="small" @click="applyTemplate(tpl)">
          {{ tpl.label }}
        </Button>
      </Space>
    </div>

    <Alert v-if="parseWarning" type="warning" :message="parseWarning" show-icon closable
      style="margin-bottom: 12px" @close="parseWarning = ''" />

    <!-- Visual Editor -->
    <div v-show="editorMode === 'visual'" class="visual-editor">
      <!-- Left Panel: Stage Canvas -->
      <div class="stage-canvas">
        <div class="canvas-header">
          <span style="font-weight: 600; font-size: 14px">流水线阶段</span>
          <span style="color: #8c8c8c; font-size: 12px">Agent: {{ config.agent }}</span>
        </div>
        <div class="canvas-flow">
          <div v-for="(stage, index) in config.stages" :key="stage.id" class="canvas-stage-wrapper">
            <!-- Arrow -->
            <div v-if="index > 0" class="canvas-arrow">
              <svg width="32" height="20" viewBox="0 0 32 20">
                <line x1="0" y1="10" x2="24" y2="10" stroke="hsl(var(--border))" stroke-width="2" />
                <polygon points="24,5 32,10 24,15" fill="hsl(var(--border))" />
              </svg>
            </div>
            <!-- Stage Node -->
            <div
              :class="['canvas-node', { 'canvas-node-selected': selectedStageId === stage.id }]"
              @click="selectedStageId = stage.id"
            >
              <div class="canvas-node-name">{{ stage.name }}</div>
              <div class="canvas-node-steps">{{ stage.steps.length }} 步骤</div>
              <Tooltip title="删除阶段">
                <button class="canvas-node-delete" @click.stop="removeStage(stage.id)">×</button>
              </Tooltip>
            </div>
          </div>
          <!-- Add Stage Button -->
          <div v-if="config.stages.length > 0" class="canvas-arrow">
            <svg width="32" height="20" viewBox="0 0 32 20">
              <line x1="0" y1="10" x2="24" y2="10" stroke="hsl(var(--border))" stroke-width="2" stroke-dasharray="4,3" />
              <polygon points="24,5 32,10 24,15" fill="hsl(var(--border))" />
            </svg>
          </div>
          <div class="canvas-add-node" @click="addStage">
            <PlusOutlined />
            <span>添加阶段</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Stage Config -->
      <div class="stage-config">
        <template v-if="selectedStage">
          <div class="config-header">
            <h4 style="margin: 0">阶段配置</h4>
            <Space size="small">
              <Tooltip title="上移"><Button size="small" @click="moveStage(selectedStage.id, 'up')"><ArrowUpOutlined /></Button></Tooltip>
              <Tooltip title="下移"><Button size="small" @click="moveStage(selectedStage.id, 'down')"><ArrowDownOutlined /></Button></Tooltip>
            </Space>
          </div>
          <Divider style="margin: 8px 0" />
          <div class="config-field">
            <label>阶段名称</label>
            <Input v-model:value="selectedStage.name" placeholder="如: Build" />
          </div>
          <Divider style="margin: 12px 0" />
          <div class="config-field">
            <label>步骤列表</label>
          </div>
          <div v-for="(step, idx) in selectedStage.steps" :key="idx" class="step-item">
            <div class="step-row">
              <Select v-model:value="step.type" :options="stepTypeOptions" size="small" style="width: 120px" />
              <Input v-if="step.type !== 'checkout'" v-model:value="step.content" size="small"
                :placeholder="step.type === 'sh' ? '如: npm install' : step.type === 'echo' ? '输出内容' : '命令'"
                style="flex: 1" />
              <span v-else style="flex: 1; color: #8c8c8c; font-size: 12px">checkout scm</span>
              <Tooltip title="删除步骤">
                <Button size="small" danger @click="removeStep(idx)"><DeleteOutlined /></Button>
              </Tooltip>
            </div>
          </div>
          <Button type="dashed" block size="small" @click="addStep" style="margin-top: 8px">
            <PlusOutlined /> 添加步骤
          </Button>
        </template>
        <div v-else class="config-empty">
          <p class="text-muted-foreground">点击左侧阶段节点进行配置</p>
          <p v-if="config.stages.length === 0" class="text-muted-foreground text-xs">
            点击"添加阶段"或选择快速模板开始
          </p>
        </div>
      </div>
    </div>

    <!-- Code Editor -->
    <div v-show="editorMode === 'code'">
      <JenkinsfileEditor v-model="jenkinsfile" height="450px" />
    </div>
  </div>
</template>

<style scoped>
.pipeline-editor { border: 1px solid hsl(var(--border)); border-radius: 8px; overflow: hidden; }

/* ==================== Toolbar ==================== */
.editor-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px; background: hsl(var(--muted)); border-bottom: 1px solid hsl(var(--border));
}
.editor-tabs { display: flex; gap: 0; }
.editor-tab {
  padding: 6px 16px; font-size: 13px; cursor: pointer;
  border: 1px solid hsl(var(--border)); color: hsl(var(--muted-foreground)); background: hsl(var(--card));
  transition: all 0.2s; user-select: none;
}
.editor-tab:first-child { border-radius: 4px 0 0 4px; }
.editor-tab:last-child { border-radius: 0 4px 4px 0; border-left: none; }
.editor-tab.active { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-color: hsl(var(--primary)); }
.editor-tab:hover:not(.active) { color: hsl(var(--primary)); border-color: hsl(var(--primary)); }

/* ==================== Visual Editor ==================== */
.visual-editor { display: flex; min-height: 420px; }

/* Left: Canvas */
.stage-canvas {
  flex: 1; border-right: 1px solid hsl(var(--border));
  display: flex; flex-direction: column;
}
.canvas-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid hsl(var(--border));
}
.canvas-flow {
  flex: 1; display: flex; align-items: center;
  padding: 24px 16px; overflow-x: auto;
  background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%);
}
.canvas-stage-wrapper { display: flex; align-items: center; flex-shrink: 0; }
.canvas-arrow { margin: 0 6px; display: flex; align-items: center; }

/* Stage Node */
.canvas-node {
  min-width: 120px; max-width: 180px; padding: 16px 20px;
  border-radius: 10px; border: 2px solid hsl(var(--border)); background: hsl(var(--card));
  text-align: center; cursor: pointer; transition: all 0.3s;
  position: relative; user-select: none;
}
.canvas-node:hover {
  border-color: #1890ff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.canvas-node-selected {
  border-color: hsl(var(--primary)) !important; background: hsl(var(--primary) / 10%);
  box-shadow: 0 0 0 3px rgba(24,144,255,0.2), 0 4px 12px rgba(24,144,255,0.15);
  transform: translateY(-2px);
}
.canvas-node-name { font-weight: 600; font-size: 14px; color: hsl(var(--foreground)); margin-bottom: 4px; }
.canvas-node-steps { font-size: 12px; color: hsl(var(--muted-foreground)); }
.canvas-node-delete {
  position: absolute; top: -8px; right: -8px;
  width: 20px; height: 20px; border-radius: 50%;
  border: none; background: #f5222d; color: #fff;
  font-size: 14px; line-height: 1; cursor: pointer;
  display: none; align-items: center; justify-content: center;
}
.canvas-node:hover .canvas-node-delete { display: flex; }

/* Add Stage */
.canvas-add-node {
  min-width: 100px; padding: 16px 20px;
  border-radius: 10px; border: 2px dashed hsl(var(--border));
  text-align: center; cursor: pointer; color: hsl(var(--muted-foreground));
  transition: all 0.3s; display: flex; flex-direction: column;
  align-items: center; gap: 4px; font-size: 13px;
}
.canvas-add-node:hover { border-color: hsl(var(--primary)); color: hsl(var(--primary)); background: hsl(var(--primary) / 8%); }

/* Right: Config Panel */
.stage-config {
  width: 340px; min-width: 340px; padding: 16px;
  overflow-y: auto; background: hsl(var(--card));
}
.config-header { display: flex; justify-content: space-between; align-items: center; }
.config-field { margin-bottom: 8px; }
.config-field label { display: block; font-size: 12px; color: hsl(var(--muted-foreground)); margin-bottom: 4px; }
.config-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }

/* Step Item */
.step-item {
  padding: 8px; margin-bottom: 6px;
  background: hsl(var(--muted)); border-radius: 6px; border: 1px solid hsl(var(--border));
}
.step-row { display: flex; align-items: center; gap: 6px; }
</style>
