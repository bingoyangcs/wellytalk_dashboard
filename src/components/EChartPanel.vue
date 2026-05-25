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
      @pointerdown="startResize"
    ></button>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
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

echarts.use([LineChart, BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  title: string;
  subtitle?: string;
  option: EChartsCoreOption;
}>();

const panelRef = ref<HTMLElement>();
const chartRef = ref<HTMLDivElement>();
const chart = shallowRef<ECharts>();
const columnSpan = ref(6);
const panelHeight = ref(384);
const resizing = ref(false);
let resizeObserver: ResizeObserver | undefined;
let resizeState:
  | {
      pointerId: number;
      startX: number;
      startY: number;
      startSpan: number;
      startHeight: number;
      columnWidth: number;
    }
  | undefined;

const panelStyle = computed(() => ({
  gridColumn: `span ${columnSpan.value}`,
  minHeight: `${panelHeight.value}px`,
}));

function renderChart() {
  if (!chartRef.value) return;
  if (!chart.value) {
    chart.value = echarts.init(chartRef.value);
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

function startResize(event: PointerEvent) {
  const grid = panelRef.value?.parentElement;
  if (!panelRef.value || !grid) return;

  const gridWidth = grid.getBoundingClientRect().width;
  const columnWidth = gridWidth / 12;
  resizing.value = true;
  resizeState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startSpan: columnSpan.value,
    startHeight: panelHeight.value,
    columnWidth,
  };

  event.currentTarget instanceof HTMLElement && event.currentTarget.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', handleResize);
  window.addEventListener('pointerup', stopResize);
}

function handleResize(event: PointerEvent) {
  if (!resizeState) return;

  const spanDelta = Math.round((event.clientX - resizeState.startX) / resizeState.columnWidth);
  columnSpan.value = Math.min(12, Math.max(4, resizeState.startSpan + spanDelta));
  panelHeight.value = Math.min(720, Math.max(300, resizeState.startHeight + event.clientY - resizeState.startY));
  chart.value?.resize();
}

function stopResize(event: PointerEvent) {
  if (resizeState && event.pointerId !== resizeState.pointerId) return;
  resizing.value = false;
  resizeState = undefined;
  window.removeEventListener('pointermove', handleResize);
  window.removeEventListener('pointerup', stopResize);
  chart.value?.resize();
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('pointermove', handleResize);
  window.removeEventListener('pointerup', stopResize);
  chart.value?.dispose();
});
</script>
