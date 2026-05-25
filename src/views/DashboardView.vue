<template>
  <main class="dashboard-shell">
    <FilterBar :filters="filters" @update="updateFilters" @refresh="loadData" />

    <el-skeleton v-if="loading && !loaded" :rows="12" animated />
    <template v-else>
      <MetricCardGrid :metrics="summary" />
      <TrendCharts
        variant="core"
        :points="timeseries"
        :selected-timestamp="selectedTimestamp"
        @select-time-point="selectTimePoint"
      />
      <CustomerLoadAttribution
        :selected-timestamp="selectedTimestamp"
        :ranking="customerRanking"
        :selected-cid="selectedCid"
        :customer-trend="customerTrend"
        @select-customer="selectCustomer"
      />
      <section class="section-heading">
        <div>
          <h2>服务器监视</h2>
          <p>WebSocket、API、响应时间、基础设施、队列和服务实例健康状态</p>
        </div>
      </section>
      <TrendCharts variant="server" :points="timeseries" />
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
import CustomerLoadAttribution from '../components/CustomerLoadAttribution.vue';
import FilterBar from '../components/FilterBar.vue';
import MetricCardGrid from '../components/MetricCardGrid.vue';
import ServiceHealthTable from '../components/ServiceHealthTable.vue';
import TrendCharts from '../components/TrendCharts.vue';
import {
  createDefaultFilters,
  fetchCustomerLoadAttribution,
  fetchCustomerTrend,
  fetchDashboardData,
} from '../api/dashboard';
import type {
  AlertItem,
  ApiRankingItem,
  CustomerLoadRankingItem,
  CustomerTrendPoint,
  DashboardFilters,
  ServiceHealthItem,
  SummaryMetric,
  TimeSeriesPoint,
} from '../types/dashboard';

const filters = ref<DashboardFilters>(createDefaultFilters());
const summary = ref<SummaryMetric[]>([]);
const timeseries = ref<TimeSeriesPoint[]>([]);
const apiRanking = ref<ApiRankingItem[]>([]);
const customerRanking = ref<CustomerLoadRankingItem[]>([]);
const customerTrend = ref<CustomerTrendPoint[]>([]);
const serviceHealth = ref<ServiceHealthItem[]>([]);
const alerts = ref<AlertItem[]>([]);
const selectedTimestamp = ref<string>();
const selectedCid = ref<string>();
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
  if (!selectedTimestamp.value || !data.timeseries.some((point) => point.timestamp === selectedTimestamp.value)) {
    selectedTimestamp.value = data.timeseries[data.timeseries.length - 1]?.timestamp;
  }
  await refreshCustomerAttribution();
  loading.value = false;
  loaded.value = true;
}

async function refreshCustomerAttribution() {
  if (!selectedTimestamp.value || !timeseries.value.length) return;
  customerRanking.value = await fetchCustomerLoadAttribution(selectedTimestamp.value, timeseries.value);
  if (!selectedCid.value || !customerRanking.value.some((customer) => customer.cid === selectedCid.value)) {
    selectedCid.value = customerRanking.value[0]?.cid;
  }
  if (selectedCid.value) {
    customerTrend.value = await fetchCustomerTrend(selectedCid.value, timeseries.value);
  }
}

function selectTimePoint(timestamp: string) {
  selectedTimestamp.value = timestamp;
  void refreshCustomerAttribution();
}

async function selectCustomer(cid: string) {
  selectedCid.value = cid;
  customerTrend.value = await fetchCustomerTrend(cid, timeseries.value);
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
