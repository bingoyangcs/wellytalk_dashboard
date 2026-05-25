import {
  createDefaultFilters,
  mockAlerts,
  mockApiRanking,
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
