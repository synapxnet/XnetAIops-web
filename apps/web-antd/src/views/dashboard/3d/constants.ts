// 服务器节点状态颜色
export const STATUS_COLORS: Record<string, number> = {
  online: 0x52c41a, // 绿色
  warning: 0xfaad14, // 黄色
  error: 0xff4d4f, // 红色
  offline: 0x8c8c8c, // 灰色
  unknown: 0xd9d9d9, // 浅灰
};

// 机架尺寸
export const RACK_WIDTH = 2.2;
export const RACK_HEIGHT = 4.6;
export const RACK_DEPTH = 1.4;
export const RACK_GAP = 3.4;
export const ROW_GAP = 6.4;

// 服务器节点尺寸 (在机架内)
export const NODE_WIDTH = 1.82;
export const NODE_HEIGHT = 0.42;
export const NODE_DEPTH = 1.08;
export const NODE_GAP = 0.08;

// 地面网格
export const GRID_SIZE = 42;
export const GRID_DIVISIONS = 28;

// 相机默认位置
export const CAMERA_POSITION = { x: 17, y: 14, z: 20 };
export const CAMERA_LOOK_AT = { x: 0, y: 2.1, z: 0 };

// 光照
export const AMBIENT_LIGHT_COLOR = 0x8eb7d8;
export const AMBIENT_LIGHT_INTENSITY = 1.4;
export const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
export const DIRECTIONAL_LIGHT_INTENSITY = 2.2;

// 场景背景色
export const SCENE_BACKGROUND = 0x1a1a2e;

export const SCENE_THEME = {
  dark: {
    background: 0x06111f,
    floor: 0x081826,
    fog: 0x06111f,
    gridPrimary: 0x164c6d,
    gridSecondary: 0x0c2b42,
    platform: 0x0b2234,
    platformEdge: 0x168bd2,
  },
  light: {
    background: 0xeaf1f8,
    floor: 0xdce7f1,
    fog: 0xeaf1f8,
    gridPrimary: 0x80a9c5,
    gridSecondary: 0xb8ccdc,
    platform: 0xf5f8fb,
    platformEdge: 0x3a86c8,
  },
} as const;
