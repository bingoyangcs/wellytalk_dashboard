<template>
  <section class="filter-bar">
    <div>
      <h1>客服服务负载监控</h1>
      <p>5 分钟粒度 · 近 24 小时 · 每 5 分钟自动刷新</p>
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
      <el-tag type="info" effect="plain">粒度 5 分钟</el-tag>
      <el-tag type="success" effect="plain">自动刷新 5 分钟</el-tag>
      <el-button :icon="Refresh" type="primary" @click="$emit('refresh')">刷新</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import type { DashboardFilters } from '../types/dashboard';

const props = defineProps<{
  filters: DashboardFilters;
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
    granularityMinutes: 5,
  });
}
</script>
