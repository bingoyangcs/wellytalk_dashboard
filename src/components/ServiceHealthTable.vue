<template>
  <section
    ref="panelRef"
    class="panel table-panel"
    :class="{ 'panel--resizing': resizing }"
    :style="panelStyle"
  >
    <div class="panel__header">
      <div>
        <h2>服务实例健康状态</h2>
        <p>网关、业务服务、数据库、缓存、队列</p>
      </div>
    </div>
    <el-table :data="items" :height="tableHeight" stripe fit>
      <el-table-column prop="service" label="服务" :width="columnWidth(1.8)" />
      <el-table-column label="类型" :width="columnWidth(1)">
        <template #default="{ row }">{{ typeText(row.type) }}</template>
      </el-table-column>
      <el-table-column label="实例" :width="columnWidth(1)">
        <template #default="{ row }">{{ row.healthyInstances }}/{{ row.instances }}</template>
      </el-table-column>
      <el-table-column label="CPU" :width="columnWidth(1)">
        <template #default="{ row }">{{ row.cpuUsage }}%</template>
      </el-table-column>
      <el-table-column label="内存" :width="columnWidth(1)">
        <template #default="{ row }">{{ row.memoryUsage }}%</template>
      </el-table-column>
      <el-table-column label="P95" :width="columnWidth(1)">
        <template #default="{ row }">{{ row.p95Latency }}ms</template>
      </el-table-column>
      <el-table-column label="错误率" :width="columnWidth(1)">
        <template #default="{ row }">{{ row.errorRate }}%</template>
      </el-table-column>
      <el-table-column label="状态" :width="columnWidth(1)">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" :width="columnWidth(1)" />
    </el-table>
    <button
      class="resize-handle"
      type="button"
      aria-label="拖拽调整表格大小"
      title="拖拽调整大小"
      @pointerdown.stop.prevent="startResize"
    ></button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useResizablePanel } from '../composables/useResizablePanel';
import type { ServiceHealthItem } from '../types/dashboard';

defineProps<{
  items: ServiceHealthItem[];
}>();

const { panelRef, panelHeight, panelWidth, panelStyle, resizing, startResize } = useResizablePanel({
  initialHeight: 486,
  minHeight: 360,
  maxHeight: 760,
});
const tableHeight = computed(() => Math.max(260, panelHeight.value - 66));
const serviceColumnUnits = 9.8;

function columnWidth(units: number) {
  return Math.max(72, Math.floor(((panelWidth.value || 832) - 24) * units / serviceColumnUnits));
}

function typeText(type: ServiceHealthItem['type']) {
  return {
    gateway: '网关',
    service: '服务',
    database: '数据库',
    cache: '缓存',
    queue: '队列',
  }[type];
}

function statusType(status: ServiceHealthItem['status']) {
  return {
    healthy: 'success',
    warning: 'warning',
    critical: 'danger',
  }[status];
}

function statusText(status: ServiceHealthItem['status']) {
  return {
    healthy: '健康',
    warning: '关注',
    critical: '异常',
  }[status];
}
</script>
