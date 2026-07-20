<script lang="ts" setup>
import { Tooltip } from 'ant-design-vue';

export interface StageItem {
  id: string | number;
  name: string;
  displayName?: string;
  result?: string;
  state?: string;
  durationInMillis?: number;
}

const props = withDefaults(defineProps<{
  stages: StageItem[];
  selectedStageId?: string | null;
  size?: 'default' | 'mini';
  clickable?: boolean;
}>(), {
  selectedStageId: null,
  size: 'default',
  clickable: false,
});

const emit = defineEmits<{
  stageClick: [stage: StageItem];
}>();

function getStageStatus(stage: StageItem): string {
  const result = stage.result || stage.state || 'unknown';
  const map: Record<string, string> = {
    SUCCESS: 'success', FAILURE: 'failed', RUNNING: 'running',
    NOT_BUILT: 'not_built', ABORTED: 'aborted', QUEUED: 'queued',
    PAUSED_PENDING_INPUT: 'paused', IN_PROGRESS: 'running',
  };
  return map[result.toUpperCase()] || result.toLowerCase();
}

function getStageStatusIcon(stage: StageItem): string {
  const icons: Record<string, string> = {
    success: '\u2714', failed: '\u2716', running: '\u25B6',
    not_built: '\u25CB', aborted: '\u25A0', queued: '\u25F7', paused: '\u275A\u275A',
  };
  return icons[getStageStatus(stage)] || '\u25CB';
}

function getStageStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    success: '#52c41a', failed: '#f5222d', running: '#1890ff',
    not_built: '#d9d9d9', aborted: '#fa8c16', queued: '#1890ff', paused: '#fa8c16',
  };
  return colors[status] || '#d9d9d9';
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}分${secs}秒`;
  return `${secs}秒`;
}

function handleClick(stage: StageItem) {
  if (props.clickable) emit('stageClick', stage);
}

defineExpose({ getStageStatus, getStageStatusDotColor, formatDuration });
</script>

<template>
  <div v-if="stages.length === 0" class="stages-empty">
    暂无阶段信息
  </div>
  <div v-else :class="['stages-pipeline', `stages-${size}`]">
    <div v-for="(stage, index) in stages" :key="stage.id" class="stage-wrapper">
      <!-- Arrow connector -->
      <div v-if="index > 0" class="stage-arrow">
        <svg v-if="size === 'default'" width="32" height="20" viewBox="0 0 32 20">
          <line x1="0" y1="10" x2="24" y2="10" stroke="#bfbfbf" stroke-width="2" />
          <polygon points="24,5 32,10 24,15" fill="#bfbfbf" />
        </svg>
        <svg v-else width="16" height="12" viewBox="0 0 16 12">
          <line x1="0" y1="6" x2="10" y2="6" stroke="#bfbfbf" stroke-width="1.5" />
          <polygon points="10,3 16,6 10,9" fill="#bfbfbf" />
        </svg>
      </div>
      <!-- Stage block -->
      <Tooltip :title="`${stage.displayName || stage.name} | ${getStageStatus(stage)} | ${formatDuration(stage.durationInMillis)}`">
        <div
          :class="[
            'stage-block',
            `stage-${getStageStatus(stage)}`,
            { 'stage-selected': selectedStageId === String(stage.id), 'stage-clickable': clickable },
          ]"
          @click="handleClick(stage)"
        >
          <div class="stage-name">{{ stage.displayName || stage.name }}</div>
          <template v-if="size === 'default'">
            <div class="stage-status-icon" :class="`icon-${getStageStatus(stage)}`">
              {{ getStageStatusIcon(stage) }}
            </div>
            <div class="stage-duration">{{ formatDuration(stage.durationInMillis) }}</div>
          </template>
          <template v-else>
            <div class="stage-mini-dot" :style="{ background: getStageStatusDotColor(getStageStatus(stage)) }" />
          </template>
        </div>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
/* ==================== Pipeline Container ==================== */
.stages-pipeline {
  display: flex;
  align-items: center;
  overflow-x: auto;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%);
  border-radius: 8px;
  min-height: 120px;
  padding: 24px 16px;
}
.stages-pipeline.stages-mini {
  min-height: unset;
  padding: 6px 8px;
  background: transparent;
  border-radius: 4px;
}
.stages-empty {
  text-align: center;
  color: #8c8c8c;
  padding: 40px 0;
  font-size: 14px;
}

/* ==================== Stage Wrapper ==================== */
.stage-wrapper { display: flex; align-items: center; flex-shrink: 0; }
.stage-arrow { margin: 0 6px; display: flex; align-items: center; }
.stages-mini .stage-arrow { margin: 0 2px; }

/* ==================== Stage Block ==================== */
.stage-block {
  min-width: 130px; max-width: 200px; padding: 14px 18px;
  border-radius: 10px; border: 2px solid #d9d9d9;
  text-align: center; transition: all 0.3s ease;
  background: #fff; position: relative; user-select: none;
}
.stage-clickable { cursor: pointer; }
.stage-block.stage-clickable:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}
.stage-selected {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 3px rgba(24,144,255,0.2), 0 4px 12px rgba(24,144,255,0.15) !important;
  transform: translateY(-2px);
}

/* Mini mode */
.stages-mini .stage-block {
  min-width: 50px; max-width: 90px; padding: 4px 8px;
  border-radius: 6px; border-width: 1.5px;
}

/* ==================== Stage Content ==================== */
.stage-name {
  font-weight: 600; font-size: 13px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #262626;
}
.stages-mini .stage-name { font-size: 11px; font-weight: 500; }

.stage-status-icon { font-size: 22px; margin: 6px 0; line-height: 1; }
.stage-duration { font-size: 12px; color: #8c8c8c; margin-top: 2px; }

.stage-mini-dot {
  width: 8px; height: 8px; border-radius: 50%;
  margin: 4px auto 0;
}

/* ==================== Status Colors ==================== */
.icon-success { color: #52c41a; }
.icon-failed { color: #f5222d; }
.icon-running { color: #1890ff; animation: spin-icon 1.2s linear infinite; }
.icon-not_built { color: #d9d9d9; }
.icon-aborted { color: #fa8c16; }
.icon-queued { color: #1890ff; }
.icon-paused { color: #fa8c16; }

.stage-success { border-color: #52c41a; background: linear-gradient(180deg, #f6ffed, #fff); }
.stage-failed { border-color: #f5222d; background: linear-gradient(180deg, #fff2f0, #fff); }
.stage-running { border-color: #1890ff; background: linear-gradient(180deg, #e6f7ff, #fff); animation: pulse 2s ease-in-out infinite; }
.stage-not_built { border-color: #d9d9d9; background: #fafafa; opacity: 0.6; }
.stage-aborted { border-color: #fa8c16; background: linear-gradient(180deg, #fff7e6, #fff); }
.stage-queued { border-color: #1890ff; background: linear-gradient(180deg, #e6f7ff, #fff); opacity: 0.8; }
.stage-paused { border-color: #fa8c16; background: linear-gradient(180deg, #fff7e6, #fff); }

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(24,144,255,0.3); }
  50% { opacity: 0.85; box-shadow: 0 0 0 6px rgba(24,144,255,0); }
}
@keyframes spin-icon {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
