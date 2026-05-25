<template>
  <section
    ref="panelRef"
    class="panel table-panel"
    :class="{ 'panel--resizing': resizing }"
    :style="panelStyle"
  >
    <div class="panel__header">
      <div>
        <h2>API 调用与错误排行</h2>
        <p>最近 1 小时 Top 10 接口负载</p>
      </div>
    </div>
    <el-table :data="items" :height="tableHeight" stripe>
      <el-table-column prop="endpoint" label="接口" min-width="220" />
      <el-table-column prop="module" label="模块" width="110" />
      <el-table-column label="调用量" width="190">
        <template #default="{ row }">
          <div class="rank-cell">
            <span>{{ row.calls.toLocaleString() }}</span>
            <el-progress :percentage="callPercentage(row.calls)" :show-text="false" :stroke-width="8" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="errors" label="错误数" width="90" />
      <el-table-column label="错误率" width="100">
        <template #default="{ row }">
          <el-tag :type="row.errorRate > 3 ? 'danger' : row.errorRate > 1.5 ? 'warning' : 'success'" effect="light">
            {{ row.errorRate }}%
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="P95" width="90">
        <template #default="{ row }">{{ row.p95Latency }}ms</template>
      </el-table-column>
    </el-table>
    <button
      class="resize-handle"
      type="button"
      aria-label="拖拽调整表格大小"
      @pointerdown="startResize"
    ></button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useResizablePanel } from '../composables/useResizablePanel';
import type { ApiRankingItem } from '../types/dashboard';

const props = defineProps<{
  items: ApiRankingItem[];
}>();

const maxCalls = computed(() => Math.max(...props.items.map((item) => item.calls), 1));
const { panelRef, panelHeight, panelStyle, resizing, startResize } = useResizablePanel({
  initialHeight: 486,
  minHeight: 360,
  maxHeight: 760,
});
const tableHeight = computed(() => Math.max(260, panelHeight.value - 66));

function callPercentage(calls: number) {
  return Math.round((calls / maxCalls.value) * 100);
}
</script>
