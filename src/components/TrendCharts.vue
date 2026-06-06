<template>
  <section v-if="variant === 'core'" class="section-stack">
    <EChartPanel
      title="核心负载趋势"
      :subtitle="`展示粒度 ${granularityLabel} · 新增/消息/API 为窗口累计，活动对话为窗口状态值 · 点击时间点查看 cid 贡献`"
      :option="loadTrendOption"
      :initial-span="24"
      @chart-click="handleLoadTrendClick"
    />
  </section>
  <section v-else class="charts-grid">
    <EChartPanel title="API 成功/失败量" subtitle="堆叠统计最近窗口请求结果" :option="apiResultOption" />
    <EChartPanel title="响应时间趋势" subtitle="AVG / P95 / P99" :option="latencyOption" />
    <EChartPanel title="WebSocket 实时通信" subtitle="连接、断开、重连" :option="websocketOption" />
    <EChartPanel title="基础设施资源" subtitle="CPU、内存、网络入站/出站" :option="infraOption" />
    <EChartPanel title="队列积压与消费延迟" subtitle="消息队列压力观察" :option="queueOption" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EChartPanel from './EChartPanel.vue';
import type { TimeSeriesPoint } from '../types/dashboard';

const props = defineProps<{
  points: TimeSeriesPoint[];
  selectedTimestamp?: string;
  variant?: 'core' | 'server';
  actualGranularityMinutes: number;
}>();

const emit = defineEmits<{
  selectTimePoint: [timestamp: string];
}>();

const labels = computed(() =>
  props.points.map((point) =>
    new Intl.DateTimeFormat(
      'zh-CN',
      props.actualGranularityMinutes >= 1440
        ? { year: '2-digit', month: '2-digit', day: '2-digit' }
        : props.actualGranularityMinutes >= 120
          ? { month: '2-digit', day: '2-digit', hour: '2-digit' }
          : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
    ).format(new Date(point.timestamp)),
  ),
);

const granularityLabel = computed(() => {
  const minutes = props.actualGranularityMinutes;
  if (minutes < 60) return `${minutes} 分钟`;
  if (minutes < 1440) return `${minutes / 60} 小时`;
  if (minutes < 10080) return `${minutes / 1440} 天`;
  return `${minutes / 10080} 周`;
});
const showSymbols = computed(() => props.points.length <= 96);

const baseGrid = {
  left: 42,
  right: 22,
  top: 42,
  bottom: 58,
};

const tooltip = {
  trigger: 'axis',
  axisPointer: { type: 'cross' },
};

const dataZoom = [
  { type: 'inside', start: 0, end: 100 },
  { type: 'slider', height: 18, bottom: 8, start: 0, end: 100 },
];

const loadTrendOption = computed(() => ({
  color: ['#7c3aed', '#2563eb', '#16a34a', '#f59e0b'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  dataZoom,
  series: [
    {
      name: '活动总对话数',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.points.map((p) => p.activeConversations),
      markLine:
        selectedIndex.value >= 0
          ? {
              symbol: 'none',
              label: { formatter: '选中窗口' },
              data: [{ xAxis: labels.value[selectedIndex.value] }],
            }
          : undefined,
    },
    {
      name: '新增对话数',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.points.map((p) => p.conversations),
    },
    {
      name: '消息发送数',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.points.map((p) => p.messages),
    },
    {
      name: 'API 调用量',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.points.map((p) => p.apiCalls),
    },
  ],
}));

const selectedIndex = computed(() =>
  props.selectedTimestamp ? props.points.findIndex((point) => point.timestamp === props.selectedTimestamp) : -1,
);

function handleLoadTrendClick(params: unknown) {
  const dataIndex = typeof params === 'object' && params && 'dataIndex' in params ? Number(params.dataIndex) : -1;
  const point = props.points[dataIndex];
  if (point) {
    emit('selectTimePoint', point.timestamp);
  }
}

const apiResultOption = computed(() => ({
  color: ['#22c55e', '#ef4444'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value },
  yAxis: { type: 'value' },
  dataZoom,
  series: [
    { name: '成功', type: 'bar', stack: 'api', data: props.points.map((p) => p.apiSuccess) },
    { name: '失败', type: 'bar', stack: 'api', data: props.points.map((p) => p.apiFailed) },
  ],
}));

const latencyOption = computed(() => ({
  color: ['#0ea5e9', '#f59e0b', '#ef4444'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value', name: 'ms' },
  dataZoom,
  series: [
    { name: 'AVG', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.latencyAvg) },
    { name: 'P95', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.latencyP95) },
    { name: 'P99', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.latencyP99) },
  ],
}));

const websocketOption = computed(() => ({
  color: ['#2563eb', '#f97316', '#a855f7'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  dataZoom,
  series: [
    { name: '连接数', type: 'line', smooth: true, showSymbol: showSymbols.value, areaStyle: {}, data: props.points.map((p) => p.wsConnections) },
    { name: '断开数', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.wsDisconnects) },
    { name: '重连数', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.wsReconnects) },
  ],
}));

const infraOption = computed(() => ({
  color: ['#0f766e', '#7c3aed', '#2563eb', '#f97316'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  dataZoom,
  series: [
    { name: 'CPU %', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.cpuUsage) },
    { name: '内存 %', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.memoryUsage) },
    { name: '入站 Mbps', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.networkIn) },
    { name: '出站 Mbps', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.networkOut) },
  ],
}));

const queueOption = computed(() => ({
  color: ['#dc2626', '#2563eb'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: [
    { type: 'value', name: '积压' },
    { type: 'value', name: 'ms' },
  ],
  dataZoom,
  series: [
    { name: '队列积压', type: 'line', smooth: true, showSymbol: showSymbols.value, data: props.points.map((p) => p.queueBacklog) },
    { name: '消费延迟', type: 'line', smooth: true, showSymbol: showSymbols.value, yAxisIndex: 1, data: props.points.map((p) => p.consumeDelay) },
  ],
}));
</script>
