<template>
  <section class="filter-bar">
    <div>
      <h1>客服服务负载监控</h1>
      <p>历史趋势自动聚合 · 实时指标保持 5 分钟口径 · 每 5 分钟自动刷新</p>
    </div>
    <div class="filter-controls">
      <el-date-picker
        v-model="localRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm"
        value-format="x"
        :clearable="false"
        @change="handleRangeChange"
      />
      <el-tag type="info" effect="plain">展示粒度 {{ granularityLabel }}</el-tag>
      <el-tag type="success" effect="plain">自动刷新 5 分钟</el-tag>
      <el-button :icon="Refresh" type="primary" @click="$emit('refresh')">刷新</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import type { DashboardFilters } from '../types/dashboard';

const props = defineProps<{
  filters: DashboardFilters;
  actualGranularityMinutes: number;
}>();

const emit = defineEmits<{
  update: [filters: DashboardFilters];
  refresh: [];
}>();

const localRange = ref<[number, number]>([
  props.filters.range[0].getTime(),
  props.filters.range[1].getTime(),
]);

watch(
  () => props.filters.range,
  (range) => {
    localRange.value = [range[0].getTime(), range[1].getTime()];
  },
);

function handleRangeChange(value: [number, number] | null) {
  if (!value) return;
  emit('update', {
    range: [new Date(value[0]), new Date(value[1])],
    granularity: 'auto',
  });
}

function formatGranularity(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`;
  if (minutes < 1440) return `${minutes / 60} 小时`;
  if (minutes < 10080) return `${minutes / 1440} 天`;
  return `${minutes / 10080} 周`;
}

const granularityLabel = computed(() => `${formatGranularity(props.actualGranularityMinutes)}（自动）`);
</script>
