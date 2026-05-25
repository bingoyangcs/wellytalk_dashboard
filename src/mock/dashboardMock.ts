import type {
  AlertItem,
  ApiRankingItem,
  DashboardFilters,
  ServiceHealthItem,
  SummaryMetric,
  TimeSeriesPoint,
} from '../types/dashboard';

const apiEndpoints = [
  ['/api/conversations/create', '会话服务'],
  ['/api/conversations/list', '会话服务'],
  ['/api/messages/send', '消息服务'],
  ['/api/messages/history', '消息服务'],
  ['/api/agents/assign', '客服分配'],
  ['/api/agents/status', '客服分配'],
  ['/api/ai/reply', 'AI 服务'],
  ['/api/ai/knowledge/search', 'AI 服务'],
  ['/api/ws/token', '网关服务'],
  ['/api/files/upload', '文件服务'],
] as const;

const serviceNames: Array<Omit<ServiceHealthItem, 'instances' | 'healthyInstances' | 'cpuUsage' | 'memoryUsage' | 'p95Latency' | 'errorRate' | 'status' | 'version'>> = [
  { service: 'api-gateway', type: 'gateway' },
  { service: 'conversation-service', type: 'service' },
  { service: 'message-service', type: 'service' },
  { service: 'agent-routing-service', type: 'service' },
  { service: 'ai-orchestrator', type: 'service' },
  { service: 'mysql-primary', type: 'database' },
  { service: 'redis-cluster', type: 'cache' },
  { service: 'message-queue', type: 'queue' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 0) {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function wave(index: number, total: number) {
  const daily = Math.sin((index / total) * Math.PI * 2 - Math.PI / 2);
  const short = Math.sin(index / 9) * 0.12;
  return 0.72 + Math.max(daily, -0.45) * 0.38 + short;
}

function spike(index: number) {
  return index % 67 === 0 || index % 113 === 0 ? 1.55 : 1;
}

function buildTimeBuckets(filters: DashboardFilters) {
  const [start, end] = filters.range;
  const step = filters.granularityMinutes * 60 * 1000;
  const buckets: Date[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += step) {
    buckets.push(new Date(time));
  }
  return buckets;
}

export function createDefaultFilters(): DashboardFilters {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return {
    range: [start, end],
    granularityMinutes: 5,
  };
}

export function mockTimeSeries(filters: DashboardFilters): Promise<TimeSeriesPoint[]> {
  const buckets = buildTimeBuckets(filters);
  const total = Math.max(buckets.length, 1);
  const points = buckets.map((bucket, index) => {
    const load = wave(index, total) * spike(index);
    const conversations = Math.round(clamp(28 * load + Math.random() * 9, 8, 82));
    const messages = Math.round(conversations * clamp(8.4 + Math.random() * 4.8, 6, 16));
    const apiCalls = Math.round(messages * clamp(3.1 + Math.random() * 1.2, 2.5, 5.4));
    const errorRate = clamp(0.006 + (load > 1.08 ? 0.008 : 0) + Math.random() * 0.01, 0.002, 0.045);
    const apiFailed = Math.round(apiCalls * errorRate);
    const wsConnections = Math.round(clamp(1320 * load + Math.random() * 210, 480, 2600));
    const activeConversations = Math.round(
      clamp(wsConnections * 0.16 + conversations * 4.6 + (load > 1 ? (load - 0.85) * 115 : 0), 180, 780),
    );
    const cpuUsage = round(clamp(34 + load * 34 + Math.random() * 7, 22, 92), 1);
    const memoryUsage = round(clamp(47 + load * 22 + Math.random() * 5, 35, 88), 1);

    return {
      timestamp: bucket.toISOString(),
      activeConversations,
      conversations,
      messages,
      apiCalls,
      apiSuccess: apiCalls - apiFailed,
      apiFailed,
      latencyAvg: round(clamp(95 + load * 62 + Math.random() * 35, 80, 260), 0),
      latencyP95: round(clamp(170 + load * 115 + Math.random() * 55, 140, 480), 0),
      latencyP99: round(clamp(260 + load * 190 + Math.random() * 90, 210, 720), 0),
      wsConnections,
      wsDisconnects: Math.round(clamp(wsConnections * (0.012 + Math.random() * 0.018), 8, 72)),
      wsReconnects: Math.round(clamp(wsConnections * (0.006 + Math.random() * 0.012), 4, 48)),
      cpuUsage,
      memoryUsage,
      networkIn: round(clamp(42 + load * 58 + Math.random() * 14, 22, 160), 1),
      networkOut: round(clamp(36 + load * 49 + Math.random() * 12, 18, 142), 1),
      queueBacklog: Math.round(clamp(load > 1 ? (load - 0.85) * 210 + Math.random() * 55 : Math.random() * 36, 0, 260)),
      consumeDelay: round(clamp(load > 1 ? (load - 0.8) * 850 + Math.random() * 180 : 60 + Math.random() * 80, 30, 1250), 0),
    };
  });

  return Promise.resolve(points);
}

export function mockSummary(points: TimeSeriesPoint[]): Promise<SummaryMetric[]> {
  const latest = points[points.length - 1];
  const previous = points[points.length - 2] ?? latest;
  if (!latest) {
    return Promise.resolve([]);
  }

  const apiErrorRate = latest.apiCalls ? (latest.apiFailed / latest.apiCalls) * 100 : 0;
  const healthyInstances = 29;
  const totalInstances = 32;
  const trend = (current: number, before = 0) => (before ? round(((current - before) / before) * 100, 1) : 0);

  return Promise.resolve([
    {
      key: 'activeConversations',
      label: '当前活动总对话数',
      value: latest.activeConversations,
      trend: trend(latest.activeConversations, previous?.activeConversations),
      status: latest.activeConversations > 680 ? 'critical' : latest.activeConversations > 520 ? 'warning' : 'normal',
      description: '当前仍在服务中的活跃会话总量',
    },
    {
      key: 'conversations',
      label: '5分钟新增对话数',
      value: latest.conversations,
      trend: trend(latest.conversations, previous?.conversations),
      status: latest.conversations > 70 ? 'warning' : 'normal',
      description: '最近一个 5 分钟窗口内创建的会话',
    },
    {
      key: 'messages',
      label: '5分钟消息发送数',
      value: latest.messages,
      trend: trend(latest.messages, previous?.messages),
      status: latest.messages > 880 ? 'warning' : 'normal',
      description: '用户、客服、机器人消息总量',
    },
    {
      key: 'apiCalls',
      label: 'API 调用量',
      value: latest.apiCalls,
      trend: trend(latest.apiCalls, previous?.apiCalls),
      status: latest.apiCalls > 3200 ? 'warning' : 'normal',
      description: '最近一个 5 分钟窗口内接口请求总量',
    },
    {
      key: 'apiErrorRate',
      label: 'API 错误率',
      value: round(apiErrorRate, 2),
      unit: '%',
      trend: trend(latest.apiFailed, previous?.apiFailed),
      status: apiErrorRate > 3 ? 'critical' : apiErrorRate > 1.5 ? 'warning' : 'normal',
      description: 'HTTP 4xx/5xx 与超时失败占比',
    },
    {
      key: 'latencyP95',
      label: 'API P95 响应时间',
      value: latest.latencyP95,
      unit: 'ms',
      trend: trend(latest.latencyP95, previous?.latencyP95),
      status: latest.latencyP95 > 380 ? 'critical' : latest.latencyP95 > 280 ? 'warning' : 'normal',
      description: '接口响应时间 P95',
    },
    {
      key: 'wsConnections',
      label: 'WebSocket 当前连接数',
      value: latest.wsConnections,
      trend: trend(latest.wsConnections, previous?.wsConnections),
      status: latest.wsConnections > 2400 ? 'warning' : 'normal',
      description: '实时通信长连接在线数量',
    },
    {
      key: 'onlineAgents',
      label: '在线客服数',
      value: Math.round(clamp(92 + latest.conversations / 2.8, 88, 126)),
      trend: round(Math.random() * 5 - 1.8, 1),
      status: 'info',
      description: '当前可服务坐席数量',
    },
    {
      key: 'queuedUsers',
      label: '排队用户数',
      value: Math.round(clamp(latest.queueBacklog / 3.8, 0, 68)),
      trend: trend(latest.queueBacklog, previous?.queueBacklog),
      status: latest.queueBacklog > 180 ? 'critical' : latest.queueBacklog > 90 ? 'warning' : 'normal',
      description: '等待人工接入的用户',
    },
    {
      key: 'healthyInstances',
      label: '系统健康实例数',
      value: `${healthyInstances}/${totalInstances}`,
      trend: -3.1,
      status: healthyInstances < totalInstances ? 'warning' : 'normal',
      description: '网关、业务服务和中间件实例健康情况',
    },
  ]);
}

export function mockApiRanking(points: TimeSeriesPoint[]): Promise<ApiRankingItem[]> {
  const totalCalls = points.slice(-12).reduce((sum, point) => sum + point.apiCalls, 0);
  const items = apiEndpoints.map(([endpoint, module], index) => {
    const weight = 1 - index * 0.065;
    const calls = Math.round((totalCalls / 8) * clamp(weight + Math.random() * 0.18, 0.28, 1.1));
    const errorRate = round(clamp(0.28 + index * 0.16 + Math.random() * 1.8, 0.1, 5.2), 2);
    return {
      endpoint,
      module,
      calls,
      errors: Math.round(calls * errorRate / 100),
      errorRate,
      p95Latency: Math.round(clamp(150 + index * 24 + Math.random() * 120, 120, 560)),
    };
  });

  return Promise.resolve(items.sort((a, b) => b.calls - a.calls));
}

export function mockServiceHealth(points: TimeSeriesPoint[]): Promise<ServiceHealthItem[]> {
  const latest = points[points.length - 1];
  const load = latest ? latest.cpuUsage / 100 : 0.5;

  const items = serviceNames.map((item, index) => {
    const instances = index < 5 ? 4 : index === 7 ? 5 : 3;
    const stressed = index === 4 || index === 7;
    const cpuUsage = round(clamp(30 + load * 45 + (stressed ? 9 : 0) + Math.random() * 8, 20, 94), 1);
    const memoryUsage = round(clamp(42 + load * 32 + (stressed ? 5 : 0) + Math.random() * 6, 28, 92), 1);
    const errorRate = round(clamp((stressed ? 1.2 : 0.25) + Math.random() * 1.1, 0.1, 4.8), 2);
    const status: ServiceHealthItem['status'] =
      cpuUsage > 86 || errorRate > 3.5 ? 'critical' : cpuUsage > 74 || errorRate > 1.8 ? 'warning' : 'healthy';
    const healthyInstances = status === 'critical' ? instances - 1 : status === 'warning' && index % 3 === 0 ? instances - 1 : instances;

    return {
      ...item,
      instances,
      healthyInstances,
      cpuUsage,
      memoryUsage,
      p95Latency: Math.round(clamp(110 + load * 240 + (stressed ? 80 : 0) + Math.random() * 70, 90, 680)),
      errorRate,
      status,
      version: `v2.${8 + (index % 4)}.${12 + index}`,
    };
  });

  return Promise.resolve(items);
}

export function mockAlerts(points: TimeSeriesPoint[]): Promise<AlertItem[]> {
  const latest = points[points.length - 1];
  const now = new Date();
  const alerts: AlertItem[] = [
    {
      id: 'alert-api-p95',
      severity: latest && latest.latencyP95 > 320 ? 'critical' : 'warning',
      title: 'AI 服务接口 P95 延迟升高',
      source: 'ai-orchestrator',
      message: '最近 15 分钟 /api/ai/reply 响应时间高于日常基线，建议关注模型调用和队列积压。',
      occurredAt: new Date(now.getTime() - 7 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-queue',
      severity: latest && latest.queueBacklog > 150 ? 'critical' : 'warning',
      title: '消息队列积压接近阈值',
      source: 'message-queue',
      message: '消费延迟上升，可能影响客服消息送达和机器人回复时效。',
      occurredAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-ws',
      severity: 'info',
      title: 'WebSocket 重连数短时波动',
      source: 'realtime-gateway',
      message: '连接重试集中出现在最近 30 分钟，当前成功率仍在正常范围。',
      occurredAt: new Date(now.getTime() - 31 * 60 * 1000).toISOString(),
    },
  ];

  return Promise.resolve(alerts);
}
