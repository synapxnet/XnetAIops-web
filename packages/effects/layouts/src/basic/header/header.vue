<script lang="ts" setup>
import { computed, useSlots } from 'vue';

import { useRefresh } from '@vben/hooks';
import { RotateCw } from '@vben/icons';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { VbenFullScreen, VbenIconButton } from '@vben-core/shadcn-ui';

import { useMediaQuery } from '@vueuse/core';
import { Cascader } from 'ant-design-vue';

import {
  GlobalSearch,
  LanguageToggle,
  PreferencesButton,
  ThemeToggle,
} from '../../widgets';

interface Props {
  /**
   * Logo 主题
   */
  theme?: string;
  /**
   * 级联选择器数据
   */
  treeData?: any[]; // 根据你的数据结构定义更精确的类型
  /**
   * 选择的组织路径
   */
  selectedOrgPath?: string[];
}

defineOptions({
  name: 'LayoutHeader',
});

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  treeData: () => [], // 默认空数组

  selectedOrgPath: () => [],
});

const emit = defineEmits<{
  clearPreferencesAndLogout: [];
  organizationChange: [value: string[]];
}>();

const REFERENCE_VALUE = 50;

const accessStore = useAccessStore();
const { globalSearchShortcutKey, preferencesButtonPosition } = usePreferences();
const slots = useSlots();
const { refresh } = useRefresh();
const compactHeader = useMediaQuery('(max-width: 767px)');

const rightSlots = computed(() => {
  const list = [{ index: REFERENCE_VALUE + 100, name: 'user-dropdown' }];
  if (preferences.widget.globalSearch) {
    list.push({
      index: REFERENCE_VALUE,
      name: 'global-search',
    });
  }

  if (preferencesButtonPosition.value.header) {
    list.push({
      index: REFERENCE_VALUE + 10,
      name: 'preferences',
    });
  }
  if (preferences.widget.themeToggle) {
    list.push({
      index: REFERENCE_VALUE + 20,
      name: 'theme-toggle',
    });
  }
  if (preferences.widget.languageToggle) {
    list.push({
      index: REFERENCE_VALUE + 30,
      name: 'language-toggle',
    });
  }
  if (preferences.widget.fullscreen) {
    list.push({
      index: REFERENCE_VALUE + 40,
      name: 'fullscreen',
    });
  }
  if (preferences.widget.notification) {
    list.push({
      index: REFERENCE_VALUE + 50,
      name: 'notification',
    });
  }

  Object.keys(slots).forEach((key) => {
    const name = key.split('-');
    if (key.startsWith('header-right')) {
      list.push({ index: Number(name[2]), name: key });
    }
  });
  return list.sort((a, b) => a.index - b.index);
});

const leftSlots = computed(() => {
  const list: Array<{ index: number; name: string }> = [];

  if (preferences.widget.refresh) {
    list.push({
      index: 0,
      name: 'refresh',
    });
  }

  Object.keys(slots).forEach((key) => {
    const name = key.split('-');
    if (key.startsWith('header-left')) {
      list.push({ index: Number(name[2]), name: key });
    }
  });
  return list.sort((a, b) => a.index - b.index);
});

/** 组织、皮肤和用户入口保持可见，其他工具可在窄屏展开。 Keep scope, skin and user access visible while grouping other tools on narrow screens. */
const utilitySlots = computed(() =>
  rightSlots.value.filter(
    (slot) => !['header-right-45', 'user-dropdown'].includes(slot.name),
  ),
);

/** Escape关闭窄屏工具面板，桌面工具保持展开。 Close the compact tools panel on Escape and retain desktop tools. */
function closeToolMenu(event: Event) {
  if (compactHeader.value && event.currentTarget instanceof HTMLDetailsElement)
    event.currentTarget.open = false;
}

/** 焦点离开工具面板后收起，保留键盘在面板内移动。 Collapse tools after focus leaves while preserving internal keyboard navigation. */
function closeToolsOnBlur(event: FocusEvent) {
  const panel = event.currentTarget as HTMLDetailsElement;
  if (
    compactHeader.value &&
    !panel.contains(event.relatedTarget as Node | null)
  )
    panel.open = false;
}

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}

/** 将级联选择器值规范化为字符串组织路径。 */
function normalizeOrganizationPath(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => Array.isArray(item))) {
    return [];
  }
  return value.map(String);
}

/** 向上层传递规范化后的租户、部门和团队路径。 */
function handleOrganizationChange(value: unknown) {
  emit('organizationChange', normalizeOrganizationPath(value));
}
</script>

<template>
  <template
    v-for="slot in leftSlots.filter((item) => item.index < REFERENCE_VALUE)"
    :key="slot.name"
  >
    <slot :name="slot.name">
      <template v-if="slot.name === 'refresh'">
        <VbenIconButton class="my-0 mr-1 rounded-md" @click="refresh">
          <RotateCw class="size-4" />
        </VbenIconButton>
      </template>
    </slot>
  </template>
  <div class="flex-center hidden lg:block">
    <slot name="breadcrumb"></slot>
  </div>
  <template
    v-for="slot in leftSlots.filter((item) => item.index > REFERENCE_VALUE)"
    :key="slot.name"
  >
    <slot :name="slot.name"></slot>
  </template>
  <div
    :class="`menu-align-${preferences.header.menuAlign}`"
    class="flex h-full min-w-0 flex-1 items-center"
  >
    <slot name="menu"></slot>
  </div>
  <div class="layout-header-actions">
    <div class="layout-header-organization">
      <span class="organization-label" title="租户 / 部门 / 团队"
        ><span class="organization-label-full">租户 / 部门 / 团队</span
        ><span class="organization-label-short">组织</span></span
      >
      <Cascader
        class="organization-cascader"
        popup-class-name="aiops-organization-menu"
        aria-label="选择租户、部门和团队"
        :value="props.selectedOrgPath"
        :options="props.treeData"
        placeholder="选择组织"
        @change="handleOrganizationChange"
        change-on-select
        expand-trigger="hover"
      />
    </div>
    <div class="layout-header-skin"><slot name="header-right-45"></slot></div>
    <details
      v-if="utilitySlots.length"
      class="layout-header-tools"
      :open="!compactHeader"
      @keydown.esc="closeToolMenu"
      @focusout="closeToolsOnBlur"
    >
      <summary aria-label="更多工具" title="更多工具">•••</summary>
      <div class="layout-header-tools-content">
        <template v-for="slot in utilitySlots" :key="slot.name">
          <slot :name="slot.name">
            <template v-if="slot.name === 'global-search'">
              <GlobalSearch
                :enable-shortcut-key="globalSearchShortcutKey"
                :menus="accessStore.accessMenus"
                class="mr-1 sm:mr-4"
              />
            </template>

            <template v-else-if="slot.name === 'preferences'">
              <PreferencesButton
                class="mr-1"
                @clear-preferences-and-logout="clearPreferencesAndLogout"
              />
            </template>
            <template v-else-if="slot.name === 'theme-toggle'">
              <ThemeToggle class="mr-1 mt-[2px]" />
            </template>
            <template v-else-if="slot.name === 'language-toggle'">
              <LanguageToggle class="mr-1" />
            </template>
            <template v-else-if="slot.name === 'fullscreen'">
              <VbenFullScreen class="mr-1" />
            </template>
          </slot>
        </template>
      </div>
    </details>
    <div class="layout-header-user"><slot name="user-dropdown"></slot></div>
  </div>
</template>
<style lang="scss" scoped>
.menu-align-start {
  --menu-align: start;
}

.menu-align-center {
  --menu-align: center;
}

.menu-align-end {
  --menu-align: end;
}

.layout-header-actions {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: 6px;
}
.layout-header-organization {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}
.organization-label {
  flex-shrink: 0;
  white-space: nowrap;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}
.organization-label-short {
  display: none;
}
.organization-cascader {
  width: 220px;
  min-width: 0;
}
.layout-header-skin,
.layout-header-user {
  flex-shrink: 0;
}
.layout-header-skin {
  display: flex;
  align-items: center;
  gap: 4px;
}
.layout-header-tools {
  flex-shrink: 0;
}
.layout-header-tools > summary {
  display: none;
}
.layout-header-tools-content {
  display: flex;
  align-items: center;
  gap: 2px;
}
.layout-header-tools:not([open]) > .layout-header-tools-content {
  display: none;
}

@media (max-width: 1100px) {
  .organization-cascader {
    width: 170px;
  }
  .organization-label-full {
    display: none;
  }
  .organization-label-short {
    display: inline;
  }
}
@media (max-width: 767px) {
  .layout-header-actions {
    flex: 1 1 auto;
    gap: 4px;
  }
  .layout-header-organization {
    flex: 1 1 100px;
    gap: 5px;
  }
  .organization-cascader {
    flex: 1 1 95px;
    width: 95px;
    min-width: 65px;
    max-width: 180px;
  }
  .layout-header-tools {
    position: relative;
  }
  .layout-header-tools > summary {
    display: flex;
    width: 30px;
    height: 32px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    list-style: none;
    border-radius: 6px;
    color: hsl(var(--foreground));
  }
  .layout-header-tools > summary::-webkit-details-marker {
    display: none;
  }
  .layout-header-tools > summary:hover {
    background: hsl(var(--accent));
  }
  .layout-header-tools-content {
    position: fixed;
    right: 12px;
    top: 56px;
    z-index: 220;
    flex-wrap: wrap;
    max-width: calc(100vw - 24px);
    padding: 12px;
    border: 1px solid hsl(var(--border));
    border-radius: 10px;
    background: hsl(var(--popover));
    box-shadow: 0 8px 28px #102a4620;
  }
  .layout-header-user :deep(.ml-1.mr-2) {
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
