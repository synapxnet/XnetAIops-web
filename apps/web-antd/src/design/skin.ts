/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
import { watch } from 'vue';
import { preferences, updatePreferences } from '@vben/preferences';
import {
  DEFAULT_SKIN,
  parseSkin,
  primaryForeground,
  SKIN_LIBRARY_KEY,
  SKIN_STORAGE_KEY,
  validateSkin,
} from './skin-model';
import type { ProductSkin } from './skin-model';
let applied: ProductSkin = { ...DEFAULT_SKIN };
let applyingSkin = false;
interface SkinLibrary {
  active: string;
  skins: ProductSkin[];
}
/** 同步组件库和页面变量，只设置白名单属性。Synchronize component libraries and explicit page variables. */
export function applySkin(value: ProductSkin): void {
  const skin = validateSkin(value);
  applyingSkin = true;
  try {
    updatePreferences({
      theme: {
        colorPrimary: skin.accent,
        mode: skin.mode === 'system' ? 'auto' : skin.mode,
        radius: String(skin.radius / 16),
      },
      app: { compact: skin.density === 'compact' },
    });
  } finally {
    applyingSkin = false;
  }
  const root = document.documentElement;
  root.dataset.aiopsDensity = skin.density;
  root.style.setProperty('--aiops-radius', skin.radius + 'px');
  root.style.setProperty('--aiops-primary', skin.accent);
  root.style.setProperty(
    '--aiops-primary-foreground',
    primaryForeground(skin.accent),
  );
  root.style.setProperty(
    '--aiops-wallpaper',
    skin.backgroundImage ? 'url("' + skin.backgroundImage + '")' : 'none',
  );
  root.style.setProperty(
    '--aiops-wallpaper-cover',
    String(1 - skin.backgroundOpacity),
  );
  root.style.setProperty('--el-color-primary', skin.accent);
  applied = { ...skin };
}
/** 读取当前预览与既有主题控件的结果。Read the current preview and existing theme-control state. */
export function currentSkin(): ProductSkin {
  return {
    ...applied,
    mode: preferences.theme.mode === 'auto' ? 'system' : preferences.theme.mode,
    accent: /^#[\da-f]{6}$/i.test(preferences.theme.colorPrimary)
      ? preferences.theme.colorPrimary
      : applied.accent,
  };
}
/** 逐个恢复有效皮肤，损坏项不妨碍其他皮肤。Recover valid saved skins independently of corrupted entries. */
function readLibrary(): SkinLibrary {
  try {
    const raw = JSON.parse(localStorage.getItem(SKIN_LIBRARY_KEY) || '{}');
    const skins: ProductSkin[] = [];
    if (Array.isArray(raw.skins))
      for (const entry of raw.skins.slice(0, 20)) {
        try {
          const skin = validateSkin(entry);
          if (!skins.some((saved) => saved.name === skin.name))
            skins.push(skin);
        } catch {
          /* 跳过损坏项。Skip corrupt entries. */
        }
      }
    return { active: typeof raw.active === 'string' ? raw.active : '', skins };
  } catch {
    return { active: '', skins: [] };
  }
}
/** 返回可供切换的本机皮肤，不暴露内部存储。Return saved local skins for selection without exposing storage internals. */
export function savedSkins(): ProductSkin[] {
  return readLibrary().skins;
}
/** 一次写入库和当前项，失败时不确认保存。Persist library and active selection atomically before confirming the save. */
export function saveSkin(value: ProductSkin): void {
  const skin = validateSkin(value);
  const library = readLibrary();
  const index = library.skins.findIndex((saved) => saved.name === skin.name);
  if (index >= 0) library.skins[index] = skin;
  else {
    if (library.skins.length >= 20)
      throw new Error('最多保存20套皮肤，请先移除一套。');
    library.skins.push(skin);
  }
  library.active = skin.name;
  localStorage.setItem(SKIN_LIBRARY_KEY, JSON.stringify(library));
  applySkin(skin);
}
/** 移除指定保存项，并在移除当前项时恢复品牌默认。Remove a saved skin and restore the brand default if it was active. */
export function removeSkin(name: string): void {
  const library = readLibrary();
  library.skins = library.skins.filter((skin) => skin.name !== name);
  if (library.active === name) library.active = '';
  localStorage.setItem(SKIN_LIBRARY_KEY, JSON.stringify(library));
  if (applied.name === name) applySkin(DEFAULT_SKIN);
}
/** 启动时载入有效皮肤，损坏资料不阻止软件启动。Load a valid saved skin without blocking startup on corruption. */
export function initializeSkin(): void {
  const library = readLibrary();
  const active = library.skins.find((skin) => skin.name === library.active);
  if (active) {
    applySkin(active);
    return;
  }
  try {
    const raw = localStorage.getItem(SKIN_STORAGE_KEY);
    applySkin(
      raw && !localStorage.getItem(SKIN_LIBRARY_KEY)
        ? parseSkin(raw)
        : { ...DEFAULT_SKIN, mode: readPreferenceMode() },
    );
  } catch {
    applySkin({ ...DEFAULT_SKIN, mode: readPreferenceMode() });
  }
}

/** 将平台自动主题映射为可移植皮肤模式。Map the platform's automatic theme to the portable skin mode. */
function readPreferenceMode(): ProductSkin['mode'] {
  return preferences.theme.mode === 'auto' ? 'system' : preferences.theme.mode;
}

/** 同步主题控件的明确选择，不保存皮肤预览或覆盖其他外观字段。Synchronize theme-control choices without saving skin previews or overwriting other appearance fields. */
function synchronizeSavedMode(mode: ProductSkin['mode']): void {
  if (applyingSkin) return;
  applied = { ...applied, mode };
  try {
    const library = readLibrary();
    const active = library.skins.find((skin) => skin.name === library.active);
    if (active) {
      if (active.mode !== mode) {
        active.mode = mode;
        localStorage.setItem(SKIN_LIBRARY_KEY, JSON.stringify(library));
      }
      return;
    }
    const legacy = localStorage.getItem(SKIN_STORAGE_KEY);
    if (legacy && !localStorage.getItem(SKIN_LIBRARY_KEY)) {
      const skin = parseSkin(legacy);
      if (skin.mode !== mode)
        localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify({ ...skin, mode }));
    }
  } catch {
    /* 存储失败保留本次主题显示，不伪造保存成功。Keep the visible theme on storage failure without reporting a successful save. */
  }
}

// 同步回调在皮肤应用保护范围内运行，临时预览不会泄漏到保存库。 Run synchronously inside the apply guard so temporary previews cannot leak into saved skins.
watch(readPreferenceMode, synchronizeSavedMode, { flush: 'sync' });
