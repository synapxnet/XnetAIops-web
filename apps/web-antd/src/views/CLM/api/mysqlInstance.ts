import type { MySQLInstance, MySQLDeployConfig } from './types';

import { clmRequestClient } from '#/api/request';

// ==================== MySQL Instance API ====================

/** 获取MySQL实例列表 */
export function getMySQLInstances(clusterId?: number) {
    const params = clusterId ? { clusterId } : {};
    return clmRequestClient.get<MySQLInstance[]>('/mysql-instances', { params });
}

/** 获取单个MySQL实例 */
export function getMySQLInstance(id: number) {
    return clmRequestClient.get<MySQLInstance>(`/mysql-instances/${id}`);
}

/** 创建MySQL实例 */
export function createMySQLInstance(data: Partial<MySQLInstance>) {
    return clmRequestClient.post<MySQLInstance>('/mysql-instances', data);
}

/** 更新MySQL实例 */
export function updateMySQLInstance(id: number, data: Partial<MySQLInstance>) {
    return clmRequestClient.put<MySQLInstance>(`/mysql-instances/${id}`, data);
}

/** 删除MySQL实例 */
export function deleteMySQLInstance(id: number) {
    return clmRequestClient.delete(`/mysql-instances/${id}`);
}

/** 测试SSH连接 */
export function testMySQLConnection(data: Partial<MySQLInstance>) {
    return clmRequestClient.post<{ success: boolean; message: string; systemInfo?: string }>(
        '/mysql-instances/test-connection',
        data,
    );
}

/** 部署MySQL */
export function deployMySQLInstance(id: number, config: MySQLDeployConfig) {
    return clmRequestClient.post<{ success: boolean; message: string; instanceId: number }>(
        `/mysql-instances/${id}/deploy`,
        config,
    );
}

/** 预览部署脚本 */
export function previewMySQLScript(config: MySQLDeployConfig) {
    return clmRequestClient.post<{ script: string }>(
        '/mysql-instances/preview-script',
        config,
    );
}

/** 检查状态 */
export function checkMySQLStatus(id: number) {
    return clmRequestClient.get<{ success: boolean; isRunning: boolean; status: string }>(
        `/mysql-instances/${id}/status`,
    );
}

/** 启动MySQL */
export function startMySQL(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/mysql-instances/${id}/start`,
    );
}

/** 停止MySQL */
export function stopMySQL(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/mysql-instances/${id}/stop`,
    );
}

/** 重启MySQL */
export function restartMySQL(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/mysql-instances/${id}/restart`,
    );
}
