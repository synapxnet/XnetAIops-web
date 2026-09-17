/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SKIN,
  MAX_IMAGE_BYTES,
  parseSkin,
  primaryForeground,
  serializeSkin,
  validateSkin,
} from './skin-model';
/** 验证跨平台皮肤边界及恶意输入。Verify portable skins and hostile-input boundaries. */
describe('portable skin contract', () => {
  /** 完整往返保留可移植字段和系统模式。Round-trip all portable fields including system mode. */
  it('round trips the canonical shared schema', () => {
    const value = {
      ...DEFAULT_SKIN,
      mode: 'system' as const,
      accent: '#60BCEC',
      radius: 0,
      backgroundOpacity: 0.4,
      density: 'compact' as const,
    };
    expect(parseSkin(serializeSkin(value))).toEqual({
      ...value,
      accent: '#60bcec',
    });
    expect(Object.keys(JSON.parse(serializeSkin(value)))).toHaveLength(9);
  });
  /** 旧格式只迁移为统一协议。Migrate legacy data into the shared schema only. */
  it('adapts the legacy single-skin format', () => {
    const legacy = {
      schemaVersion: '1.0.0',
      name: '旧皮肤',
      primary: '#123456',
      mode: 'dark',
      background: '',
      radius: 8,
      density: 'spacious',
    };
    expect(validateSkin(legacy)).toMatchObject({
      schema: 'synapxnet.skin',
      version: 1,
      accent: '#123456',
      density: 'comfortable',
    });
    expect(serializeSkin(validateSkin(legacy))).not.toContain('schemaVersion');
  });
  /** 不接受代码、远程图、越界值及多余字段。Reject code, remote images, out-of-range values and extra fields. */
  it('rejects unsafe or malformed imports without coercion', () => {
    for (const value of [
      { css: 'body{display:none}' },
      { accent: 'red' },
      { mode: 'auto' },
      { name: ' ' },
      { radius: -1 },
      { radius: '12' },
      { backgroundOpacity: 0.41 },
      { density: 'spacious' },
      { version: 2 },
      { backgroundImage: 'https://example.com/x.png' },
      { backgroundImage: 'data:image/svg+xml;base64,PHN2Zy8+' },
      { backgroundImage: 'data:image/png;base64,PHN2Zy8+' },
    ]) {
      expect(() => validateSkin({ ...DEFAULT_SKIN, ...value })).toThrow();
    }
    expect(() => parseSkin('{')).toThrow('JSON');
    expect(() => parseSkin('[]')).toThrow();
  });
  /** 接受签名一致的位图并拒绝超过原始字节上限的图片。Accept matching bitmap signatures and reject oversized decoded images. */
  it('checks decoded image signatures and byte limits', () => {
    const png = 'data:image/png;base64,' + btoa('\x89PNG\r\n\x1a\n');
    expect(
      validateSkin({ ...DEFAULT_SKIN, backgroundImage: png }).backgroundImage,
    ).toBe(png);
    const large =
      'data:image/png;base64,' +
      btoa('\x89PNG\r\n\x1a\n' + 'a'.repeat(MAX_IMAGE_BYTES));
    expect(() =>
      validateSkin({ ...DEFAULT_SKIN, backgroundImage: large }),
    ).toThrow();
  });
  /** 浅色和深色主色各使用可辨识的按钮文字。Choose readable button text for light and dark accent colors. */
  it('chooses contrasting foregrounds', () => {
    expect(primaryForeground('#ffffff')).toBe('#102031');
    expect(primaryForeground('#000000')).toBe('#ffffff');
  });
});
