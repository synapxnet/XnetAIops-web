/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SKIN, SKIN_LIBRARY_KEY, SKIN_STORAGE_KEY } from './skin-model';
const state = vi.hoisted(() => ({
  theme: { colorPrimary: '#187bbd', mode: 'light', radius: '0.75' },
}));
/** 模拟偏好存储，只验证皮肤在浏览器中的外观和保存行为。Mock preferences to verify browser appearance and persistence behavior only. */
vi.mock('@vben/preferences', async () => {
  const { reactive } = await import('vue');
  state.theme = reactive(state.theme);
  return {
    preferences: state,
    updatePreferences: (value: typeof state) =>
      Object.assign(state.theme, value.theme),
  };
});
import {
  applySkin,
  currentSkin,
  initializeSkin,
  removeSkin,
  savedSkins,
  saveSkin,
} from './skin';
/** 验证预览、多皮肤、恢复及存储异常。Verify previews, multiple skins, restoration and storage failures. */
describe('local skin library', () => {
  /** 每例清除本机测试状态。Clear local test state for each case. */
  beforeEach(() => {
    localStorage.clear();
    Object.assign(state.theme, {
      colorPrimary: '#187bbd',
      mode: 'light',
      radius: '0.75',
    });
    initializeSkin();
  });
  /** 缺省皮肤和损坏皮肤都保留刷新前的主题选择。Preserve the prior theme across initialization with absent or corrupt skin data. */
  it('retains dark and automatic preferences without a saved skin', () => {
    for (const mode of ['dark', 'auto']) {
      state.theme.mode = mode;
      initializeSkin();
      expect(state.theme.mode).toBe(mode);
      localStorage.setItem(SKIN_LIBRARY_KEY, '{');
      initializeSkin();
      expect(state.theme.mode).toBe(mode);
      localStorage.clear();
    }
  });
  /** 显式保存的皮肤模式优先于先前通用偏好。Honor an explicitly saved skin mode over the earlier general preference. */
  it('honors the saved skin mode on initialization', () => {
    state.theme.mode = 'dark';
    const skin = { ...DEFAULT_SKIN, name: '已保存浅色' };
    localStorage.setItem(
      SKIN_LIBRARY_KEY,
      JSON.stringify({ active: skin.name, skins: [skin] }),
    );
    initializeSkin();
    expect(state.theme.mode).toBe('light');
    expect(savedSkins()[0]).toEqual(skin);
  });
  /** 工具栏只同步当前皮肤模式，重新初始化仍保留深色及自动模式。Persist only the active skin mode and retain dark and automatic choices on reinitialization. */
  it('keeps theme toggles and the active saved skin consistent across reloads', () => {
    const other = { ...DEFAULT_SKIN, name: '另一套', accent: '#102030' };
    const active = { ...DEFAULT_SKIN, name: '当前', accent: '#203040', radius: 6 };
    saveSkin(other);
    saveSkin(active);
    for (const mode of ['dark', 'auto']) {
      state.theme.mode = mode;
      expect(savedSkins()[0]).toEqual(other);
      expect(savedSkins()[1]).toEqual({
        ...active,
        mode: mode === 'auto' ? 'system' : mode,
      });
      applySkin(DEFAULT_SKIN);
      initializeSkin();
      expect(state.theme.mode).toBe(mode);
      expect(currentSkin().accent).toBe(active.accent);
    }
  });
  /** 预览和取消不会写入当前保存皮肤，也不会改变刷新结果。Preview and cancellation never update the saved skin or alter the reload result. */
  it('does not persist temporary mode previews into the active skin', () => {
    const saved = { ...DEFAULT_SKIN, name: '正式皮肤' };
    saveSkin(saved);
    const before = currentSkin();
    applySkin({ ...saved, mode: 'dark', accent: '#102030' });
    expect(savedSkins()[0]).toEqual(saved);
    applySkin(before);
    expect(savedSkins()[0]).toEqual(saved);
    initializeSkin();
    expect(currentSkin()).toEqual(saved);
  });
  /** 旧单皮肤的主题选择同步后仍可刷新恢复。Retain theme changes across reloads for the legacy single-skin store. */
  it('synchronizes mode for a legacy single saved skin', () => {
    const skin = { ...DEFAULT_SKIN, name: '旧单皮肤', accent: '#123456' };
    localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(skin));
    initializeSkin();
    state.theme.mode = 'dark';
    expect(JSON.parse(localStorage.getItem(SKIN_STORAGE_KEY)!)).toEqual({
      ...skin,
      mode: 'dark',
    });
    applySkin(DEFAULT_SKIN);
    initializeSkin();
    expect(currentSkin()).toEqual({ ...skin, mode: 'dark' });
  });
  /** 预览不会写入库，可恢复之前的外观。Preview does not save and can restore the previous appearance. */
  it('previews without saving and restores the prior skin', () => {
    const before = currentSkin();
    applySkin({
      ...before,
      accent: '#fafafa',
      mode: 'system',
      radius: 0,
      density: 'compact',
      backgroundOpacity: 0.4,
    });
    expect(localStorage.getItem(SKIN_LIBRARY_KEY)).toBeNull();
    expect(state.theme.mode).toBe('auto');
    expect(
      document.documentElement.style.getPropertyValue(
        '--aiops-wallpaper-cover',
      ),
    ).toBe('0.6');
    expect(document.documentElement.dataset.aiopsDensity).toBe('compact');
    applySkin(before);
    expect(currentSkin()).toEqual(before);
  });
  /** 多套外观独立保存，同名更新不会新增重复项。Save multiple appearances independently and update matching names without duplicates. */
  it('saves, updates, reloads and removes named skins', () => {
    saveSkin({ ...DEFAULT_SKIN, name: '蓝', accent: '#102030' });
    saveSkin({ ...DEFAULT_SKIN, name: '青', accent: '#203040' });
    saveSkin({ ...DEFAULT_SKIN, name: '蓝', accent: '#304050' });
    expect(savedSkins()).toHaveLength(2);
    applySkin(DEFAULT_SKIN);
    initializeSkin();
    expect(currentSkin()).toMatchObject({ name: '蓝', accent: '#304050' });
    removeSkin('蓝');
    initializeSkin();
    expect(currentSkin().name).toBe(DEFAULT_SKIN.name);
    expect(savedSkins()[0]?.name).toBe('青');
  });
  /** 单项损坏不会阻止其他有效皮肤加载。A corrupt entry does not prevent another valid skin from loading. */
  it('recovers valid entries from a partly corrupted library', () => {
    localStorage.setItem(
      SKIN_LIBRARY_KEY,
      JSON.stringify({
        active: '有效',
        skins: [{ bad: true }, { ...DEFAULT_SKIN, name: '有效' }],
      }),
    );
    initializeSkin();
    expect(currentSkin().name).toBe('有效');
    localStorage.setItem(SKIN_LIBRARY_KEY, '{');
    initializeSkin();
    expect(currentSkin()).toEqual(DEFAULT_SKIN);
  });
  /** 旧版皮肤仍能加载但新保存格式统一。Load a legacy single skin and save with the canonical schema. */
  it('loads legacy storage without exporting legacy fields', () => {
    localStorage.setItem(
      SKIN_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: '1.0.0',
        name: '旧',
        primary: '#123456',
        mode: 'dark',
        background: '',
        radius: 9,
        density: 'compact',
      }),
    );
    initializeSkin();
    expect(currentSkin().name).toBe('旧');
    saveSkin(currentSkin());
    expect(localStorage.getItem(SKIN_LIBRARY_KEY)).toContain('synapxnet.skin');
    expect(localStorage.getItem(SKIN_LIBRARY_KEY)).not.toContain(
      'schemaVersion',
    );
  });
  /** 磁盘配额失败时不确认保存，不覆盖原皮肤。Do not confirm or replace a saved skin when storage quota fails. */
  it('keeps the current appearance on storage failure', () => {
    const before = currentSkin();
    const original = globalThis.localStorage;
    vi.stubGlobal('localStorage', {
      getItem: original.getItem.bind(original),
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
    });
    try {
      expect(() =>
        saveSkin({ ...DEFAULT_SKIN, name: '未保存', accent: '#123456' }),
      ).toThrow();
      expect(currentSkin()).toEqual(before);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
