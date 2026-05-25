<template>
  <section class="section-stack">
    <section class="panel attribution-panel">
      <div class="panel__header">
        <div>
          <h2>客户负载贡献 Top 10</h2>
          <p>{{ selectedWindowText }} · 按活动总对话数排序</p>
        </div>
        <el-tag type="primary" effect="plain">cid 归因</el-tag>
      </div>
      <el-table
        :data="ranking"
        height="420"
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
        <el-table-column prop="apiCalls" label="API" min-width="86" />
        <el-table-column label="贡献" min-width="90">
          <template #default="{ row }">{{ row.contributionRate }}%</template>
        </el-table-column>
        <el-table-column label="变化" min-width="90">
          <template #default="{ row }">
            <span :class="row.changeRate >= 0 ? 'trend-up' : 'trend-down'">
              {{ row.changeRate >= 0 ? '+' : '' }}{{ row.changeRate }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <EChartPanel
      title="选中客户近 24 小时趋势"
      :subtitle="selectedCustomerText"
      :option="customerTrendOption"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EChartPanel from './EChartPanel.vue';
import type { CustomerLoadRankingItem, CustomerTrendPoint } from '../types/dashboard';

const props = defineProps<{
  selectedTimestamp?: string;
  ranking: CustomerLoadRankingItem[];
  selectedCid?: string;
  customerTrend: CustomerTrendPoint[];
}>();

const emit = defineEmits<{
  selectCustomer: [cid: string];
}>();

const selectedWindowText = computed(() => {
  if (!props.selectedTimestamp) return '未选择时间窗口';
  const start = new Date(props.selectedTimestamp);
  const end = new Date(start.getTime() + 5 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
});

const selectedCustomerText = computed(() => {
  const item = props.ranking.find((customer) => customer.cid === props.selectedCid);
  return item ? `${item.cid} · ${item.customerName}` : '点击左侧 cid 查看客户趋势';
});

const labels = computed(() =>
  props.customerTrend.map((point) =>
    new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(point.timestamp)),
  ),
);

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
    bottom: 34,
  },
  xAxis: { type: 'category', data: labels.value, boundaryGap: false },
  yAxis: { type: 'value' },
  series: [
    {
      name: '活动对话',
      type: 'line',
      smooth: true,
      data: props.customerTrend.map((point) => point.activeConversations),
    },
    {
      name: '消息数',
      type: 'line',
      smooth: true,
      data: props.customerTrend.map((point) => point.messages),
    },
    {
      name: 'API 调用',
      type: 'line',
      smooth: true,
      data: props.customerTrend.map((point) => point.apiCalls),
    },
  ],
}));

function handleRowClick(row: CustomerLoadRankingItem) {
  emit('selectCustomer', row.cid);
}
</script>
