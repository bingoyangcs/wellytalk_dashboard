<template>
  <section
    ref="panelRef"
    class="panel chart-panel"
    :class="{ 'chart-panel--resizing': resizing }"
    :style="panelStyle"
  >
    <div class="panel__header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div ref="chartRef" class="chart"></div>
    <button
      class="chart-resize-handle"
      type="button"
      aria-label="拖拽调整图表大小"
      title="拖拽调整大小"
      @pointerdown.stop.prevent="startResize"
    ></button>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
} from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { useResizablePanel } from '../composables/useResizablePanel';

echarts.use([LineChart, BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  title: string;
  subtitle?: string;
  option: EChartsCoreOption;
}>();

const emit = defineEmits<{
  chartClick: [params: unknown];
}>();

const chartRef = ref<HTMLDivElement>();
const chart = shallowRef<ECharts>();
let resizeObserver: ResizeObserver | undefined;
const { panelRef, panelStyle, resizing, startResize } = useResizablePanel({
  initialHeight: 384,
  onResize: () => chart.value?.resize(),
});

function renderChart() {
  if (!chartRef.value) return;
  if (!chart.value) {
    chart.value = echarts.init(chartRef.value);
    chart.value.on('click', (params) => emit('chartClick', params));
  }
  chart.value.setOption(props.option, true);
}

onMounted(() => {
  renderChart();
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => chart.value?.resize());
    resizeObserver.observe(chartRef.value);
  }
});

watch(() => props.option, renderChart, { deep: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart.value?.dispose();
});
</script>
