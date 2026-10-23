/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
/** 四平台可移植皮肤契约。Portable four-platform skin contract. */
export interface ProductSkin {
  schema: 'synapxnet.skin';
  version: 1;
  name: string;
  accent: string;
  mode: 'dark' | 'light' | 'system';
  backgroundImage: string;
  backgroundOpacity: number;
  radius: number;
  density: 'comfortable' | 'compact';
}
export const SKIN_STORAGE_KEY = 'synapxnet:aiops:skin:v1';
export const SKIN_LIBRARY_KEY = 'synapxnet:aiops:skin-library:v1';
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_SKIN_BYTES = 2_810_000;
export const DEFAULT_SKIN: ProductSkin = {
  schema: 'synapxnet.skin',
  version: 1,
  name: 'SynapXnet 蓝青',
  accent: '#187bbd',
  mode: 'light',
  backgroundImage: '',
  backgroundOpacity: 0.12,
  radius: 12,
  density: 'comfortable',
};
/** 验证本地位图格式与体积，拒绝SVG、远程URL及脚本。Validate bounded local bitmaps and reject SVG, URLs and scripts. */
export function validBackground(value: unknown): value is string {
  if (value === '') return true;
  if (typeof value !== 'string' || value.length > MAX_SKIN_BYTES) return false;
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  try {
    const bytes = atob(match[2]!);
    if (bytes.length > MAX_IMAGE_BYTES) return false;
    if (match[1] === 'png') return bytes.startsWith('\x89PNG\r\n\x1a\n');
    if (match[1] === 'jpeg') return bytes.startsWith('\xff\xd8\xff');
    return bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
  } catch {
    return false;
  }
}
/** 兼容早期本地格式，但只导出统一协议。Adapt the early local format while exporting the shared schema only. */
function migrateLegacy(
  value: Record<string, unknown>,
): Record<string, unknown> {
  if (value.schemaVersion !== '1.0.0') return value;
  const keys = [
    'schemaVersion',
    'name',
    'primary',
    'mode',
    'background',
    'radius',
    'density',
  ];
  if (
    Object.keys(value).some((key) => !keys.includes(key)) ||
    keys.some((key) => !(key in value))
  )
    return value;
  if (!['comfortable', 'compact', 'spacious'].includes(String(value.density)))
    return value;
  return {
    schema: 'synapxnet.skin',
    version: 1,
    name: value.name,
    accent: value.primary,
    mode: value.mode,
    backgroundImage: value.background,
    backgroundOpacity: 0.12,
    radius: value.radius,
    density: value.density === 'compact' ? 'compact' : 'comfortable',
  };
}
/** 严格验证可导入字段，不接受任意CSS属性。Strictly validate imports without accepting arbitrary CSS properties. */
export function validateSkin(input: unknown): ProductSkin {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('皮肤文件必须是JSON对象。');
  const value = migrateLegacy(input as Record<string, unknown>);
  const keys = [
    'schema',
    'version',
    'name',
    'accent',
    'mode',
    'backgroundImage',
    'backgroundOpacity',
    'radius',
    'density',
  ];
  if (
    Object.keys(value).some((key) => !keys.includes(key)) ||
    keys.some((key) => !(key in value))
  )
    throw new Error('皮肤字段不完整或包含不支持的内容。');
  if (
    value.schema !== 'synapxnet.skin' ||
    value.version !== 1 ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 60
  )
    throw new Error('皮肤版本或名称无效。');
  if (typeof value.accent !== 'string' || !/^#[\da-f]{6}$/i.test(value.accent))
    throw new Error('主色需为六位十六进制色值。');
  if (
    !['dark', 'light', 'system'].includes(String(value.mode)) ||
    !['comfortable', 'compact'].includes(String(value.density))
  )
    throw new Error('明暗或紧凑度选项无效。');
  if (
    typeof value.radius !== 'number' ||
    !Number.isFinite(value.radius) ||
    value.radius < 0 ||
    value.radius > 24
  )
    throw new Error('圆角应在0至24之间。');
  if (
    typeof value.backgroundOpacity !== 'number' ||
    !Number.isFinite(value.backgroundOpacity) ||
    value.backgroundOpacity < 0 ||
    value.backgroundOpacity > 0.4
  )
    throw new Error('背景可见度应在0至40%之间。');
  if (!validBackground(value.backgroundImage))
    throw new Error('背景只支持2MB以内的本地PNG、JPEG或WebP位图。');
  return {
    ...value,
    name: value.name.trim(),
    accent: value.accent.toLowerCase(),
  } as unknown as ProductSkin;
}
/** 先限制文件大小再解析内容。Bound file size before parsing JSON. */
export function parseSkin(text: string): ProductSkin {
  if (new TextEncoder().encode(text).length > MAX_SKIN_BYTES)
    throw new Error('皮肤文件过大。');
  try {
    return validateSkin(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('皮肤文件不是有效JSON。');
    throw error;
  }
}
/** 导出只包含皮肤字段，不包含用户和业务数据。Export only skin fields without user or business data. */
export function serializeSkin(skin: ProductSkin): string {
  return JSON.stringify(validateSkin(skin), null, 2);
}
/** 按颜色亮度选择按钮文字，提高自定义色对比。Choose foreground text from color luminance. */
export function primaryForeground(hex: string): string {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const luminance = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * luminance[0]! +
    0.7152 * luminance[1]! +
    0.0722 * luminance[2]! >
    0.179
    ? '#102031'
    : '#ffffff';
}
