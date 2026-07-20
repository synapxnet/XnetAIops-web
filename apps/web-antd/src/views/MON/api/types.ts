export interface AlertRule {
  id: number;
  uid: string;
  clusterId: number;
  ruleName: string;
  serviceName: string;
  expression: string;
  compareMethod: string;
  thresholdValue: number;
  alertLevel: string;
  durationSeconds: number;
  enabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: number;
  uid: string;
  clusterId: number;
  alertRuleId: number;
  alertName: string;
  hostname: string;
  alertLevel: string;
  alertInfo: string;
  alertAdvice: string;
  status: string;
  triggeredAt: string;
  resolvedAt: string;
}

export interface NotifyGroup {
  id: number;
  groupName: string;
  notifyType: string;
  webhookUrl: string;
  createdAt: string;
}

export interface AlertSummary {
  totalAlerts: number;
  openAlerts: number;
  criticalAlerts: number;
}
