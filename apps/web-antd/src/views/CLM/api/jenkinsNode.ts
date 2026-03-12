import type { JenkinsNode, JenkinsNodeDeployConfig } from './types';

import { clmRequestClient } from '#/api/request';

// ==================== Jenkins Node API ====================

/** 获取Jenkins Node列表 */
export function getJenkinsNodes() {
    return clmRequestClient.get<JenkinsNode[]>('/jenkins-nodes');
}

/** 获取单个Jenkins Node */
export function getJenkinsNode(id: number) {
    return clmRequestClient.get<JenkinsNode>(`/jenkins-nodes/${id}`);
}

/** 创建Jenkins Node */
export function createJenkinsNode(data: Partial<JenkinsNode>) {
    return clmRequestClient.post<JenkinsNode>('/jenkins-nodes', data);
}

/** 更新Jenkins Node */
export function updateJenkinsNode(id: number, data: Partial<JenkinsNode>) {
    return clmRequestClient.put<JenkinsNode>(`/jenkins-nodes/${id}`, data);
}

/** 删除Jenkins Node */
export function deleteJenkinsNode(id: number) {
    return clmRequestClient.delete(`/jenkins-nodes/${id}`);
}

/** 测试SSH连接 */
export function testJenkinsNodeConnection(data: Partial<JenkinsNode>) {
    return clmRequestClient.post<{ success: boolean; message: string; systemInfo?: string }>(
        '/jenkins-nodes/test-connection',
        data,
    );
}

/** 部署Jenkins Node */
export function deployJenkinsNode(id: number, config: JenkinsNodeDeployConfig) {
    return clmRequestClient.post<{ success: boolean; message: string; nodeId: number }>(
        `/jenkins-nodes/${id}/deploy`,
        config,
    );
}

/** 检查状态 */
export function checkJenkinsNodeStatus(id: number) {
    return clmRequestClient.get<{ success: boolean; isRunning: boolean; status: string }>(
        `/jenkins-nodes/${id}/status`,
    );
}

/** 启动Agent */
export function startAgent(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-nodes/${id}/start`,
    );
}

/** 停止Agent */
export function stopAgent(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-nodes/${id}/stop`,
    );
}

/** 卸载Agent */
export function uninstallAgent(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-nodes/${id}/uninstall`,
    );
}

// ==================== 辅助函数 ====================

/** 获取状态文本 */
export const getStatusText = (status?: string): string => {
    switch (status) {
        case 'pending': return '待部署';
        case 'deploying': return '部署中';
        case 'deployed': return '已部署';
        case 'running': return '运行中';
        case 'stopped': return '已停止';
        case 'failed': return '部署失败';
        case 'offline': return '离线';
        default: return status || '未知';
    }
};

/** 获取状态颜色 */
export const getStatusColor = (status?: string): string => {
    switch (status) {
        case 'pending': return 'default';
        case 'deploying': return 'processing';
        case 'deployed': return 'cyan';
        case 'running': return 'success';
        case 'stopped': return 'warning';
        case 'failed': return 'error';
        case 'offline': return 'default';
        default: return 'default';
    }
};
