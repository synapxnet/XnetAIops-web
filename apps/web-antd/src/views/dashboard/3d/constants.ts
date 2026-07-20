// 服务器节点状态颜色
export const STATUS_COLORS: Record<string, number> = {
  online: 0x52c41a,   // 绿色
  warning: 0xfaad14,  // 黄色
  error: 0xff4d4f,    // 红色
  offline: 0x8c8c8c,  // 灰色
  unknown: 0xd9d9d9,  // 浅灰
};

// 机架尺寸
export const RACK_WIDTH = 2;
export const RACK_HEIGHT = 4;
export const RACK_DEPTH = 1;
export const RACK_GAP = 3;       // 机架间距
export const ROW_GAP = 5;        // 行间距

// 服务器节点尺寸 (在机架内)
export const NODE_WIDTH = 1.6;
export const NODE_HEIGHT = 0.3;
export const NODE_DEPTH = 0.8;
export const NODE_GAP = 0.05;    // 节点间距

// 地面网格
export const GRID_SIZE = 60;
export const GRID_DIVISIONS = 30;

// 相机默认位置
export const CAMERA_POSITION = { x: 15, y: 20, z: 25 };
export const CAMERA_LOOK_AT = { x: 0, y: 0, z: 0 };

// 光照
export const AMBIENT_LIGHT_COLOR = 0x404040;
export const AMBIENT_LIGHT_INTENSITY = 2;
export const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
export const DIRECTIONAL_LIGHT_INTENSITY = 1.5;

// 场景背景色
export const SCENE_BACKGROUND = 0x1a1a2e;
