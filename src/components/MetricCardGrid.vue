<template>
  <section class="metric-grid">
    <article v-for="metric in metrics" :key="metric.key" class="metric-card">
      <div class="metric-card__top">
        <span>{{ metric.label }}</span>
        <el-tag :type="tagType(metric.status)" effect="light" size="small">{{ statusText(metric.status) }}</el-tag>
      </div>
      <div class="metric-card__value">
        {{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small>
      </div>
      <div class="metric-card__meta">
        <span :class="metric.trend >= 0 ? 'trend-up' : 'trend-down'">
          {{ metric.trend >= 0 ? '+' : '' }}{{ metric.trend }}%
        </span>
        <span>{{ metric.description }}</span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { SummaryMetric } from '../types/dashboard';

defineProps<{
  metrics: SummaryMetric[];
}>();

function tagType(status: SummaryMetric['status']) {
  return {
    normal: 'success',
    warning: 'warning',
    critical: 'danger',
    info: 'primary',
  }[status];
}

function statusText(status: SummaryMetric['status']) {
  return {
    normal: '正常',
    warning: '关注',
    critical: '异常',
    info: '信息',
  }[status];
}
</script>
