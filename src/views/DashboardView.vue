<template>
  <main class="dashboard-shell">
    <FilterBar
      :filters="filters"
      :actual-granularity-minutes="actualGranularityMinutes"
      @update="updateFilters"
      @refresh="loadData"
    />

    <el-skeleton v-if="loading && !loaded" :rows="12" animated />
    <template v-else>
      <MetricCardGrid :metrics="summary" />
      <TrendCharts
        variant="core"
        :points="timeseries"
        :selected-timestamp="selectedTimestamp"
        :actual-granularity-minutes="actualGranularityMinutes"
        @select-time-point="selectTimePoint"
      />
      <CustomerLoadAttribution
        :selected-timestamp="selectedTimestamp"
        :ranking="customerRanking"
        :selected-cid="selectedCid"
        :customer-trend="customerTrend"
        :actual-granularity-minutes="actualGranularityMinutes"
        @select-customer="selectCustomer"
        @drill-down="drillDownSelectedWindow"
      />
      <section class="section-heading">
        <div>
          <h2>服务器监视</h2>
          <p>WebSocket、API、响应时间、基础设施、队列和服务实例健康状态</p>
        </div>
      </section>
      <TrendCharts
        variant="server"
        :points="timeseries"
        :actual-granularity-minutes="actualGranularityMinutes"
      />
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
const actualGranularityMinutes = ref(5);
const loading = ref(false);
const loaded = ref(false);
let refreshTimer: number | undefined;

async function loadData() {
  loading.value = true;
  const data = await fetchDashboardData(filters.value);
  actualGranularityMinutes.value = data.actualGranularityMinutes;
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
  customerRanking.value = await fetchCustomerLoadAttribution(
    selectedTimestamp.value,
    actualGranularityMinutes.value,
    timeseries.value,
  );
  if (!selectedCid.value || !customerRanking.value.some((customer) => customer.cid === selectedCid.value)) {
    selectedCid.value = customerRanking.value[0]?.cid;
  }
  if (selectedCid.value) {
    customerTrend.value = await fetchCustomerTrend(
      selectedCid.value,
      actualGranularityMinutes.value,
      timeseries.value,
    );
  }
}

function selectTimePoint(timestamp: string) {
  selectedTimestamp.value = timestamp;
  void refreshCustomerAttribution();
}

async function selectCustomer(cid: string) {
  selectedCid.value = cid;
  customerTrend.value = await fetchCustomerTrend(cid, actualGranularityMinutes.value, timeseries.value);
}

function drillDownSelectedWindow() {
  if (!selectedTimestamp.value) return;
  const start = new Date(selectedTimestamp.value);
  const end = new Date(start.getTime() + actualGranularityMinutes.value * 60 * 1000);
  filters.value = {
    range: [start, end],
    granularity: 'auto',
  };
  void loadData();
}

function updateFilters(nextFilters: DashboardFilters) {
  filters.value = nextFilters;
  void loadData();
}

onMounted(() => {
  void loadData();
  refreshTimer = window.setInterval(() => {
    const currentEnd = filters.value.range[1];
    const now = new Date();
    if (Math.abs(now.getTime() - currentEnd.getTime()) <= 10 * 60 * 1000) {
      const duration = currentEnd.getTime() - filters.value.range[0].getTime();
      filters.value = {
        range: [new Date(now.getTime() - duration), now],
        granularity: 'auto',
      };
    }
    void loadData();
  }, 5 * 60 * 1000);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
});
</script>
