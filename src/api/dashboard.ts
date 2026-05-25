import {
  createDefaultFilters,
  mockAlerts,
  mockApiRanking,
  mockCustomerLoadRanking,
  mockCustomerTrend,
  mockServiceHealth,
  mockSummary,
  mockTimeSeries,
} from '../mock/dashboardMock';
import type { DashboardFilters } from '../types/dashboard';

export { createDefaultFilters };

export async function fetchDashboardData(filters: DashboardFilters) {
  const timeseries = await mockTimeSeries(filters);
  const [summary, apiRanking, serviceHealth, alerts] = await Promise.all([
    mockSummary(timeseries),
    mockApiRanking(timeseries),
    mockServiceHealth(timeseries),
    mockAlerts(timeseries),
  ]);

  return {
    summary,
    timeseries,
    apiRanking,
    serviceHealth,
    alerts,
  };
}

export async function fetchCustomerLoadAttribution(selectedTimestamp: string, points: Awaited<ReturnType<typeof mockTimeSeries>>) {
  return mockCustomerLoadRanking(points, selectedTimestamp);
}

export async function fetchCustomerTrend(cid: string, points: Awaited<ReturnType<typeof mockTimeSeries>>) {
  return mockCustomerTrend(points, cid);
}
