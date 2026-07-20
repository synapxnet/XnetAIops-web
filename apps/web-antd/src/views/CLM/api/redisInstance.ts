import type { RedisInstance, RedisDeployConfig } from './types';

import { clmRequestClient } from '#/api/request';

// ==================== Redis Instance API ====================

/** 获取Redis实例列表 */
export function getRedisInstances(clusterId?: number) {
    const params = clusterId ? { clusterId } : {};
    return clmRequestClient.get<RedisInstance[]>('/redis-instances', { params });
}

/** 获取单个Redis实例 */
export function getRedisInstance(id: number) {
    return clmRequestClient.get<RedisInstance>(`/redis-instances/${id}`);
}

/** 创建Redis实例 */
export function createRedisInstance(data: Partial<RedisInstance>) {
    return clmRequestClient.post<RedisInstance>('/redis-instances', data);
}

/** 更新Redis实例 */
export function updateRedisInstance(id: number, data: Partial<RedisInstance>) {
    return clmRequestClient.put<RedisInstance>(`/redis-instances/${id}`, data);
}

/** 删除Redis实例 */
export function deleteRedisInstance(id: number) {
    return clmRequestClient.delete(`/redis-instances/${id}`);
}

/** 测试SSH连接 */
export function testRedisConnection(data: Partial<RedisInstance>) {
    return clmRequestClient.post<{ success: boolean; message: string; systemInfo?: string }>(
        '/redis-instances/test-connection',
        data,
    );
}

/** 部署Redis */
export function deployRedisInstance(id: number, config: RedisDeployConfig) {
    return clmRequestClient.post<{ success: boolean; message: string; instanceId: number }>(
        `/redis-instances/${id}/deploy`,
        config,
    );
}

/** 预览部署脚本 */
export function previewRedisScript(config: RedisDeployConfig) {
    return clmRequestClient.post<{ script: string }>(
        '/redis-instances/preview-script',
        config,
    );
}

/** 检查状态 */
export function checkRedisStatus(id: number) {
    return clmRequestClient.get<{ success: boolean; isRunning: boolean; status: string }>(
        `/redis-instances/${id}/status`,
    );
}

/** 启动Redis */
export function startRedis(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/redis-instances/${id}/start`,
    );
}

/** 停止Redis */
export function stopRedis(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/redis-instances/${id}/stop`,
    );
}

/** 重启Redis */
export function restartRedis(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/redis-instances/${id}/restart`,
    );
}
