import type { HadoopCluster, HadoopDeployConfig } from './types';

import { clmRequestClient } from '#/api/request';

// ==================== Hadoop Cluster API ====================

/** 获取Hadoop集群列表 */
export function getHadoopClusters() {
    return clmRequestClient.get<HadoopCluster[]>('/hadoop-clusters');
}

/** 获取单个Hadoop集群 */
export function getHadoopCluster(id: number) {
    return clmRequestClient.get<HadoopCluster>(`/hadoop-clusters/${id}`);
}

/** 创建Hadoop集群 */
export function createHadoopCluster(data: Partial<HadoopCluster>) {
    return clmRequestClient.post<HadoopCluster>('/hadoop-clusters', data);
}

/** 更新Hadoop集群 */
export function updateHadoopCluster(id: number, data: Partial<HadoopCluster>) {
    return clmRequestClient.put<HadoopCluster>(`/hadoop-clusters/${id}`, data);
}

/** 删除Hadoop集群 */
export function deleteHadoopCluster(id: number) {
    return clmRequestClient.delete(`/hadoop-clusters/${id}`);
}

/** 测试SSH连接 */
export function testHadoopConnection(data: Partial<HadoopCluster>) {
    return clmRequestClient.post<{ success: boolean; message: string; systemInfo?: string }>(
        '/hadoop-clusters/test-connection',
        data,
    );
}

/** 部署Hadoop */
export function deployHadoopCluster(id: number, config: HadoopDeployConfig) {
    return clmRequestClient.post<{ success: boolean; message: string; clusterId: number }>(
        `/hadoop-clusters/${id}/deploy`,
        config,
    );
}

/** 检查状态 */
export function checkHadoopStatus(id: number) {
    return clmRequestClient.get<{ success: boolean; isRunning: boolean; status: string }>(
        `/hadoop-clusters/${id}/status`,
    );
}

/** 预览部署脚本 */
export function previewHadoopScript(config: HadoopDeployConfig) {
    return clmRequestClient.post<{ script: string }>(
        '/hadoop-clusters/preview-script',
        config,
    );
}

/** 获取Master列表 (用于Node关联) */
export function getHadoopMasters() {
    return clmRequestClient.get<HadoopCluster[]>('/hadoop-clusters/masters');
}

/** 获取集群按状态 */
export function getHadoopClustersByStatus(status: string) {
    return clmRequestClient.get<HadoopCluster[]>(`/hadoop-clusters/status/${status}`);
}
