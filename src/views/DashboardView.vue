<template>
  <main class="dashboard-shell">
    <FilterBar :filters="filters" @update="updateFilters" @refresh="loadData" />

    <el-skeleton v-if="loading && !loaded" :rows="12" animated />
    <template v-else>
      <MetricCardGrid :metrics="summary" />
      <TrendCharts :points="timeseries" />
      <section class="tables-grid">
        <ApiRankingTable :items="apiRanking" />
        <ServiceHealthTable :items="serviceHealth" />
      </section>
      <AlertsPanel :alerts="alerts" />
    </template>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AlertsPanel from '../components/AlertsPanel.vue';
import ApiRankingTable from '../components/ApiRankingTable.vue';
import FilterBar from '../components/FilterBar.vue';
import MetricCardGrid from '../components/MetricCardGrid.vue';
import ServiceHealthTable from '../components/ServiceHealthTable.vue';
import TrendCharts from '../components/TrendCharts.vue';
import { createDefaultFilters, fetchDashboardData } from '../api/dashboard';
import type {
  AlertItem,
  ApiRankingItem,
  DashboardFilters,
  ServiceHealthItem,
  SummaryMetric,
  TimeSeriesPoint,
} from '../types/dashboard';

const filters = ref<DashboardFilters>(createDefaultFilters());
const summary = ref<SummaryMetric[]>([]);
const timeseries = ref<TimeSeriesPoint[]>([]);
const apiRanking = ref<ApiRankingItem[]>([]);
const serviceHealth = ref<ServiceHealthItem[]>([]);
const alerts = ref<AlertItem[]>([]);
const loading = ref(false);
const loaded = ref(false);
let refreshTimer: number | undefined;

async function loadData() {
  loading.value = true;
  const data = await fetchDashboardData(filters.value);
  summary.value = data.summary;
  timeseries.value = data.timeseries;
  apiRanking.value = data.apiRanking;
  serviceHealth.value = data.serviceHealth;
  alerts.value = data.alerts;
  loading.value = false;
  loaded.value = true;
}

function updateFilters(nextFilters: DashboardFilters) {
  filters.value = nextFilters;
  void loadData();
}

onMounted(() => {
  void loadData();
  refreshTimer = window.setInterval(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    filters.value = { range: [start, end], granularityMinutes: 5 };
    void loadData();
  }, 5 * 60 * 1000);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
});
</script>
