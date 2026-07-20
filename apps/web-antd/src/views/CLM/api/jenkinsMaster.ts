import type { JenkinsMaster, JenkinsMasterDeployConfig, JenkinsVersion } from './types';

import { clmRequestClient } from '#/api/request';

// ==================== Jenkins Master API ====================

/** 获取Jenkins Master列表 */
export function getJenkinsMasters() {
    return clmRequestClient.get<JenkinsMaster[]>('/jenkins-masters');
}

/** 获取单个Jenkins Master */
export function getJenkinsMaster(id: number) {
    return clmRequestClient.get<JenkinsMaster>(`/jenkins-masters/${id}`);
}

/** 创建Jenkins Master */
export function createJenkinsMaster(data: Partial<JenkinsMaster>) {
    return clmRequestClient.post<JenkinsMaster>('/jenkins-masters', data);
}

/** 更新Jenkins Master */
export function updateJenkinsMaster(id: number, data: Partial<JenkinsMaster>) {
    return clmRequestClient.put<JenkinsMaster>(`/jenkins-masters/${id}`, data);
}

/** 删除Jenkins Master */
export function deleteJenkinsMaster(id: number) {
    return clmRequestClient.delete(`/jenkins-masters/${id}`);
}

/** 测试SSH连接 */
export function testJenkinsMasterConnection(data: Partial<JenkinsMaster>) {
    return clmRequestClient.post<{ success: boolean; message: string; osInfo?: string; hostname?: string }>(
        '/jenkins-masters/test-connection',
        data,
    );
}

/** 部署Jenkins Master */
export function deployJenkinsMaster(id: number, config: JenkinsMasterDeployConfig) {
    return clmRequestClient.post<{ success: boolean; message: string; masterId: number }>(
        `/jenkins-masters/${id}/deploy`,
        config,
    );
}

/** 检查状态 */
export function checkJenkinsMasterStatus(id: number) {
    return clmRequestClient.get<{ success: boolean; isRunning: boolean; isResponding: boolean; status: string }>(
        `/jenkins-masters/${id}/status`,
    );
}

/** 启动Jenkins */
export function startJenkins(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-masters/${id}/start`,
    );
}

/** 停止Jenkins */
export function stopJenkins(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-masters/${id}/stop`,
    );
}

/** 重启Jenkins */
export function restartJenkins(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-masters/${id}/restart`,
    );
}

/** 获取初始密码 */
export function getInitialPassword(id: number) {
    return clmRequestClient.get<string>(`/jenkins-masters/${id}/initial-password`);
}

/** 配置凭证 */
export function configureCredentials(id: number, config: JenkinsMasterDeployConfig) {
    return clmRequestClient.post<{ success: boolean; message: string; createdCredentials: string[] }>(
        `/jenkins-masters/${id}/credentials`,
        config,
    );
}

/** 卸载Jenkins */
export function uninstallJenkins(id: number) {
    return clmRequestClient.post<{ success: boolean; message: string }>(
        `/jenkins-masters/${id}/uninstall`,
    );
}

/** 获取已部署的Master列表 */
export function getDeployedMasters() {
    return clmRequestClient.get<JenkinsMaster[]>('/jenkins-masters/deployed');
}

/** 获取HOM主机列表(从主机管理选择) */
export function getHomHosts() {
    return clmRequestClient.get<any[]>('/jenkins-masters/hom-hosts');
}

/** 预览部署脚本 */
export function previewMasterDeployScript(osType: string, config: JenkinsMasterDeployConfig) {
    return clmRequestClient.post<{ script: string; osType: string }>(
        `/jenkins-masters/preview-script?osType=${osType}`,
        config,
    );
}

/** 在Master上创建Node配置 */
export function createNodeOnMaster(masterId: number, nodeName: string, workDir: string, labels?: string) {
    const params = new URLSearchParams({ nodeName, workDir });
    if (labels) params.append('labels', labels);
    return clmRequestClient.post<{ success: boolean; nodeName: string; secret?: string }>(
        `/jenkins-masters/${masterId}/create-node?${params.toString()}`,
    );
}

/** 获取Node的Secret */
export function getNodeSecret(masterId: number, nodeName: string) {
    return clmRequestClient.get<{ secret: string }>(
        `/jenkins-masters/${masterId}/node-secret/${nodeName}`,
    );
}

// ==================== Jenkins 版本管理 ====================

/** 获取LTS版本列表 */
export function fetchJenkinsLtsVersions() {
    return clmRequestClient.get<JenkinsVersion[]>('/jenkins-versions/lts');
}

/** 获取稳定版本列表 */
export function fetchJenkinsStableVersions() {
    return clmRequestClient.get<JenkinsVersion[]>('/jenkins-versions');
}

/** 刷新版本列表 */
export function refreshJenkinsVersions() {
    return clmRequestClient.post<{ success: boolean; count?: number; message?: string; durationMs?: number }>(
        '/jenkins-versions/refresh',
    );
}

/** 获取版本统计 */
export function fetchJenkinsVersionStats() {
    return clmRequestClient.get<{ stableCount: number; ltsCount: number; latestVersion?: string }>(
        '/jenkins-versions/stats',
    );
}

// ==================== 辅助函数 ====================

/** 获取状态文本 */
export const getStatusText = (status?: string): string => {
    switch (status) {
        case 'pending': return '待部署';
        case 'deploying': return '部署中';
        case 'deployed': return '已部署';
        case 'failed': return '部署失败';
        case 'running': return '运行中';
        case 'stopped': return '已停止';
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
        case 'failed': return 'error';
        case 'stopped': return 'warning';
        default: return 'default';
    }
};

/** 获取地域文本 */
export const getRegionText = (region?: string): string => {
    const regionMap: Record<string, string> = {
        guangzhou: '广州', beijing: '北京', shanghai: '上海',
        shenzhen: '深圳', hangzhou: '杭州', nanjing: '南京',
        silicon_valley: '硅谷', singapore: '新加坡',
        tokyo: '东京', frankfurt: '法兰克福',
    };
    return regionMap[region || ''] || region || '-';
};
