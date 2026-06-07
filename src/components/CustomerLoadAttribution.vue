<template>
  <section class="section-stack">
    <section
      ref="rankingPanelRef"
      class="panel attribution-panel table-panel"
      :class="{ 'panel--resizing': rankingResizing }"
      :style="rankingPanelStyle"
    >
      <div class="panel__header">
        <div>
          <h2>客户负载贡献 Top 10</h2>
          <p>{{ selectedWindowText }} · 按活动总对话数排序</p>
        </div>
        <div class="panel__actions">
          <el-tag type="primary" effect="plain">{{ granularityLabel }}</el-tag>
          <el-button
            v-if="actualGranularityMinutes > 5"
            type="primary"
            plain
            size="small"
            @click="$emit('drillDown')"
          >
            下钻该窗口
          </el-button>
        </div>
      </div>
      <el-table
        :data="ranking"
        :height="rankingTableHeight"
        stripe
        highlight-current-row
        :current-row-key="selectedCid"
        row-key="cid"
        @row-click="handleRowClick"
      >
        <el-table-column prop="cid" label="CID" min-width="118" />
        <el-table-column prop="customerName" label="客户" min-width="118" />
        <el-table-column prop="activeConversations" label="活动对话" min-width="96" />
        <el-table-column prop="newConversations" label="新增" min-width="76" />
        <el-table-column prop="messages" label="消息" min-width="86" />
        <el-table-column label="变化" min-width="90">
          <template #default="{ row }">
            <span :class="row.changeRate >= 0 ? 'trend-up' : 'trend-down'">
              {{ row.changeRate >= 0 ? '+' : '' }}{{ row.changeRate }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
      <button
        class="resize-handle"
        type="button"
        aria-label="拖拽调整客户负载贡献表大小"
        title="拖拽调整大小"
        @pointerdown.stop.prevent="startRankingResize"
      ></button>
    </section>

    <EChartPanel
      title="选中客户趋势"
      :subtitle="`${selectedCustomerText} · 展示粒度 ${granularityLabel}`"
      :option="customerTrendOption"
      :initial-span="24"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EChartPanel from './EChartPanel.vue';
import { useResizablePanel } from '../composables/useResizablePanel';
import type { CustomerLoadRankingItem, CustomerTrendPoint } from '../types/dashboard';

const props = defineProps<{
  selectedTimestamp?: string;
  ranking: CustomerLoadRankingItem[];
  selectedCid?: string;
  customerTrend: CustomerTrendPoint[];
  actualGranularityMinutes: number;
}>();

const emit = defineEmits<{
  selectCustomer: [cid: string];
  drillDown: [];
}>();

const {
  panelRef: rankingPanelRef,
  panelHeight: rankingPanelHeight,
  panelStyle: rankingPanelStyle,
  resizing: rankingResizing,
  startResize: startRankingResize,
} = useResizablePanel({
  initialSpan: 24,
  initialHeight: 486,
  minHeight: 360,
  maxHeight: 760,
});
const rankingTableHeight = computed(() => Math.max(260, rankingPanelHeight.value - 66));

const selectedWindowText = computed(() => {
  if (!props.selectedTimestamp) return '未选择时间窗口';
  const start = new Date(props.selectedTimestamp);
  const end = new Date(start.getTime() + props.actualGranularityMinutes * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
});

const granularityLabel = computed(() => {
  const minutes = props.actualGranularityMinutes;
  if (minutes < 60) return `${minutes} 分钟`;
  if (minutes < 1440) return `${minutes / 60} 小时`;
  if (minutes < 10080) return `${minutes / 1440} 天`;
  return `${minutes / 10080} 周`;
});

const selectedCustomerText = computed(() => {
  const item = props.ranking.find((customer) => customer.cid === props.selectedCid);
  return item ? `${item.cid} · ${item.customerName}` : '点击左侧 cid 查看客户趋势';
});

const labels = computed(() =>
  props.customerTrend.map((point) =>
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
const showSymbols = computed(() => props.customerTrend.length <= 96);

const customerTrendOption = computed(() => ({
  color: ['#7c3aed', '#16a34a', '#f59e0b'],
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: { top: 6, right: 12 },
  grid: {
    left: 42,
    right: 22,
    top: 42,
    bottom: 58,
  },
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  dataZoom: [
    { type: 'inside', start: 0, end: 100 },
    { type: 'slider', height: 18, bottom: 8, start: 0, end: 100 },
  ],
  series: [
    {
      name: '活动对话',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.customerTrend.map((point) => point.activeConversations),
    },
    {
      name: '消息数',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.customerTrend.map((point) => point.messages),
    },
    {
      name: 'API 调用',
      type: 'line',
      smooth: true,
      showSymbol: showSymbols.value,
      data: props.customerTrend.map((point) => point.apiCalls),
    },
  ],
}));

function handleRowClick(row: CustomerLoadRankingItem) {
  emit('selectCustomer', row.cid);
}
</script>
