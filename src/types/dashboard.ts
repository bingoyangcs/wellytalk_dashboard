export interface DashboardFilters {
  range: [Date, Date];
  granularityMinutes: 5;
}

export interface SummaryMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  trend: number;
  status: 'normal' | 'warning' | 'critical' | 'info';
  description: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  activeConversations: number;
  conversations: number;
  messages: number;
  apiCalls: number;
  apiSuccess: number;
  apiFailed: number;
  latencyAvg: number;
  latencyP95: number;
  latencyP99: number;
  wsConnections: number;
  wsDisconnects: number;
  wsReconnects: number;
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
  queueBacklog: number;
  consumeDelay: number;
}

export interface ApiRankingItem {
  endpoint: string;
  module: string;
  calls: number;
  errors: number;
  errorRate: number;
  p95Latency: number;
}

export interface CustomerLoadRankingItem {
  cid: string;
  customerName: string;
  activeConversations: number;
  newConversations: number;
  messages: number;
  apiCalls: number;
  errorRate: number;
  p95Latency: number;
  contributionRate: number;
  changeRate: number;
}

export interface CustomerTrendPoint {
  timestamp: string;
  activeConversations: number;
  messages: number;
  apiCalls: number;
}

export interface ServiceHealthItem {
  service: string;
  type: 'gateway' | 'service' | 'database' | 'cache' | 'queue';
  instances: number;
  healthyInstances: number;
  cpuUsage: number;
  memoryUsage: number;
  p95Latency: number;
  errorRate: number;
  status: 'healthy' | 'warning' | 'critical';
  version: string;
}

export interface AlertItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  source: string;
  message: string;
  occurredAt: string;
}
