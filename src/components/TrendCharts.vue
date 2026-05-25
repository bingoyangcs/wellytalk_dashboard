<template>
  <section class="charts-grid">
    <EChartPanel
      title="核心负载趋势"
      subtitle="点击任意时间点查看客户 cid 贡献"
      :option="loadTrendOption"
      @chart-click="handleLoadTrendClick"
    />
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
}>();

const emit = defineEmits<{
  selectTimePoint: [timestamp: string];
}>();

const labels = computed(() =>
  props.points.map((point) =>
    new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(point.timestamp)),
  ),
);

const baseGrid = {
  left: 42,
  right: 22,
  top: 42,
  bottom: 34,
};

const tooltip = {
  trigger: 'axis',
  axisPointer: { type: 'cross' },
};

const loadTrendOption = computed(() => ({
  color: ['#7c3aed', '#2563eb', '#16a34a', '#f59e0b'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  series: [
    { name: '活动总对话数', type: 'line', smooth: true, data: props.points.map((p) => p.activeConversations) },
    { name: '新增对话数', type: 'line', smooth: true, data: props.points.map((p) => p.conversations) },
    { name: '消息发送数', type: 'line', smooth: true, data: props.points.map((p) => p.messages) },
    { name: 'API 调用量', type: 'line', smooth: true, data: props.points.map((p) => p.apiCalls) },
  ],
  graphic: selectedIndex.value >= 0 ? [] : [],
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
  series: [
    { name: 'AVG', type: 'line', smooth: true, data: props.points.map((p) => p.latencyAvg) },
    { name: 'P95', type: 'line', smooth: true, data: props.points.map((p) => p.latencyP95) },
    { name: 'P99', type: 'line', smooth: true, data: props.points.map((p) => p.latencyP99) },
  ],
}));

const websocketOption = computed(() => ({
  color: ['#2563eb', '#f97316', '#a855f7'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  series: [
    { name: '连接数', type: 'line', smooth: true, areaStyle: {}, data: props.points.map((p) => p.wsConnections) },
    { name: '断开数', type: 'line', smooth: true, data: props.points.map((p) => p.wsDisconnects) },
    { name: '重连数', type: 'line', smooth: true, data: props.points.map((p) => p.wsReconnects) },
  ],
}));

const infraOption = computed(() => ({
  color: ['#0f766e', '#7c3aed', '#2563eb', '#f97316'],
  tooltip,
  legend: { top: 6, right: 12 },
  grid: baseGrid,
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  series: [
    { name: 'CPU %', type: 'line', smooth: true, data: props.points.map((p) => p.cpuUsage) },
    { name: '内存 %', type: 'line', smooth: true, data: props.points.map((p) => p.memoryUsage) },
    { name: '入站 Mbps', type: 'line', smooth: true, data: props.points.map((p) => p.networkIn) },
    { name: '出站 Mbps', type: 'line', smooth: true, data: props.points.map((p) => p.networkOut) },
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
  series: [
    { name: '队列积压', type: 'line', smooth: true, data: props.points.map((p) => p.queueBacklog) },
    { name: '消费延迟', type: 'line', smooth: true, yAxisIndex: 1, data: props.points.map((p) => p.consumeDelay) },
  ],
}));
</script>
