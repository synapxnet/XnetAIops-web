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
import { reactive, ref, watch } from 'vue';
import {
  Button,
  Drawer,
  Input,
  Radio,
  RadioGroup,
  Select,
  Slider,
  message,
} from 'ant-design-vue';
import {
  applySkin,
  currentSkin,
  removeSkin,
  savedSkins,
  saveSkin,
} from '../design/skin';
import {
  DEFAULT_SKIN,
  MAX_IMAGE_BYTES,
  MAX_SKIN_BYTES,
  parseSkin,
  serializeSkin,
  validateSkin,
} from '../design/skin-model';
import type { ProductSkin } from '../design/skin-model';
defineProps<{ floating?: boolean }>();
const open = ref(false);
const draft = reactive<ProductSkin>({ ...DEFAULT_SKIN });
let beforePreview = { ...DEFAULT_SKIN };
const backgroundInput = ref<HTMLInputElement>();
const importInput = ref<HTMLInputElement>();
const library = ref<ProductSkin[]>([]);
const selectedName = ref<string>();
/** 从当前皮肤开启可撤销预览。Open a reversible preview from the current skin. */
function show(): void {
  beforePreview = currentSkin();
  Object.assign(draft, beforePreview);
  library.value = savedSkins();
  selectedName.value = undefined;
  open.value = true;
}
/** 选择已保存皮肤进入预览，取消仍可恢复。Preview a saved skin while preserving cancellation. */
function selectSaved(value: unknown): void {
  const skin = library.value.find((entry) => entry.name === value);
  if (skin) {
    Object.assign(draft, skin);
    selectedName.value = skin.name;
  }
}
/** 移除选中的本机保存项，仍保留当前编辑内容。Remove the selected local saved entry while preserving current edits. */
function deleteSaved(): void {
  if (!selectedName.value) return;
  try {
    removeSkin(selectedName.value);
    library.value = savedSkins();
    selectedName.value = undefined;
    applySkin(draft);
    message.success('已移除保存项，当前预览仍保留');
  } catch {
    message.error('无法更新本机皮肤库。');
  }
}
/** 取消时恢复进入前的外观。Restore the pre-preview appearance when cancelled. */
function cancel(): void {
  applySkin(beforePreview);
  open.value = false;
}
/** 保存失败保持编辑内容，允许导出备份。Keep edits on persistence failure and allow export. */
function save(): void {
  try {
    saveSkin(draft);
    beforePreview = { ...draft };
    open.value = false;
    message.success('皮肤已保存在本机');
  } catch (error) {
    message.error(
      error instanceof Error && error.message.includes('20')
        ? error.message
        : '名称或设置无效，或本机存储不可用；可先导出皮肤文件。',
    );
  }
}
/** 预览默认品牌皮肤，仍需点击保存。Preview the default brand skin without silently saving it. */
function reset(): void {
  Object.assign(draft, DEFAULT_SKIN);
}
/** 只在面板打开时应用有效预览。Apply valid previews only while the editor is open. */
function preview(): void {
  if (open.value) {
    try {
      applySkin(draft);
    } catch {
      /* 输入未完成时保留上次有效预览。Keep the last valid preview while input is incomplete. */
    }
  }
}
watch(draft, preview, { deep: true });
/** 读取本地文件，不上传背景。Read a local background without uploading it. */
function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    /** 读取完成后返回有界位图。Return the bounded bitmap after reading. */
    reader.onload = () => resolve(String(reader.result));
    /** 将读取错误交给界面处理。Propagate read failures to the UI. */
    reader.onerror = () => reject(new Error('背景文件读取失败。'));
    reader.readAsDataURL(file);
  });
}
/** 限制位图大小与格式并验证真实解码。Bound bitmap input and verify actual image decoding. */
async function importBackground(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (
      file.size > MAX_IMAGE_BYTES ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    )
      throw new Error('请选择2MB以内的PNG、JPEG或WebP背景。');
    const backgroundImage = await readDataUrl(file);
    validateSkin({ ...draft, backgroundImage });
    const image = new Image();
    image.src = backgroundImage;
    await image.decode();
    draft.backgroundImage = backgroundImage;
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '背景文件无法读取。',
    );
  } finally {
    input.value = '';
  }
}
/** 导入皮肤只更新预览，保存动作由用户决定。Import a skin into preview and leave saving to the user. */
async function importSkin(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_SKIN_BYTES) throw new Error('皮肤文件过大。');
    const skin = parseSkin(await file.text());
    if (skin.backgroundImage) {
      const image = new Image();
      image.src = skin.backgroundImage;
      await image.decode();
    }
    Object.assign(draft, skin);
    message.success('皮肤已载入预览，保存后生效。');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '无法导入皮肤。');
  } finally {
    input.value = '';
  }
}
/** 导出经过验证的外观字段，不包含业务数据。Export validated appearance fields without business data. */
function exportSkin(): void {
  try {
    const objectUrl = URL.createObjectURL(
      new Blob([serializeSkin(draft)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'SynapXnet-AIOps-skin.json';
    anchor.click();
    /** 下载触发后释放临时URL。Release the temporary URL after initiating the download. */
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '皮肤无法导出。');
  }
}
</script>
<template>
  <Button
    class="aiops-skin-trigger"
    :class="{ 'aiops-skin-floating': floating }"
    aria-label="自定义皮肤"
    @click="show"
    ><span aria-hidden="true">◈</span
    ><span class="aiops-skin-trigger-label">皮肤</span></Button
  >
  <Drawer
    :open="open"
    title="让工作台更像你"
    width="min(430px, 100vw)"
    :mask-closable="false"
    @close="cancel"
    class="aiops-skin-drawer"
  >
    <p class="aiops-field-note">
      调整后实时预览。保存到本机，或导出后在另一台设备使用。
    </p>
    <div class="aiops-skin-fields">
      <label
        >我的皮肤<Select
          :value="selectedName"
          placeholder="选择一套已保存皮肤"
          aria-label="已保存皮肤"
          :options="
            library.map((skin) => ({ value: skin.name, label: skin.name }))
          "
          @change="selectSaved"
      /></label>
      <div class="aiops-skin-actions">
        <Button :disabled="!selectedName" @click="deleteSaved"
          >移除保存项</Button
        ><span class="aiops-field-note">同名保存会更新；换个名称可另存。</span>
      </div>
      <label
        >皮肤名称<Input
          v-model:value="draft.name"
          :maxlength="60"
          aria-label="皮肤名称"
      /></label>
      <label
        >主色
        <div class="aiops-color-field">
          <input
            v-model="draft.accent"
            type="color"
            aria-label="选择皮肤主色"
          /><Input
            v-model:value="draft.accent"
            aria-label="主色色值"
            :maxlength="7"
          /></div
      ></label>
      <label
        >明暗<RadioGroup v-model:value="draft.mode"
          ><Radio value="light">浅色</Radio><Radio value="dark">深色</Radio
          ><Radio value="system">跟随系统</Radio></RadioGroup
        ></label
      >
      <label
        >圆角 <span>{{ draft.radius }} px</span
        ><Slider
          v-model:value="draft.radius"
          :min="0"
          :max="24"
          aria-label="皮肤圆角"
      /></label>
      <label
        >页面密度<Select
          v-model:value="draft.density"
          aria-label="页面密度"
          :options="[
            { value: 'compact', label: '紧凑' },
            { value: 'comfortable', label: '舒适' },
          ]"
      /></label>
      <label
        >背景图片
        <div
          class="aiops-skin-background"
          :style="
            draft.backgroundImage
              ? { backgroundImage: 'url(' + draft.backgroundImage + ')' }
              : {}
          "
        >
          <span v-if="!draft.backgroundImage"
            >选择自己的背景，资料仍清晰可读</span
          >
        </div></label
      >
      <label
        >背景可见度 <span>{{ Math.round(draft.backgroundOpacity * 100) }}%</span
        ><Slider
          v-model:value="draft.backgroundOpacity"
          :min="0"
          :max="0.4"
          :step="0.01"
          aria-label="背景可见度"
      /></label>
      <div class="aiops-skin-actions">
        <Button @click="backgroundInput?.click()">上传背景</Button
        ><Button
          :disabled="!draft.backgroundImage"
          @click="draft.backgroundImage = ''"
          >移除</Button
        >
      </div>
      <p class="aiops-field-note">
        本地PNG、JPEG、WebP，最大2MB。图片保留在本机。
      </p>
      <div class="aiops-skin-actions">
        <Button @click="importInput?.click()">导入皮肤</Button
        ><Button @click="exportSkin">导出皮肤</Button
        ><Button @click="reset">品牌默认</Button>
      </div>
      <input
        ref="backgroundInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        @change="importBackground"
      />
      <input
        ref="importInput"
        type="file"
        accept=".json,application/json"
        hidden
        @change="importSkin"
      />
    </div>
    <template #footer
      ><div class="aiops-skin-actions">
        <Button @click="cancel">取消预览</Button
        ><Button type="primary" @click="save">保存皮肤</Button>
      </div></template
    >
  </Drawer>
</template>
