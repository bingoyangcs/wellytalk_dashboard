import {
  createDefaultFilters,
  mockAlerts,
  mockApiRanking,
  mockCustomerLoadRanking,
  mockCustomerTrend,
  mockServiceHealth,
  mockSummary,
  mockTimeSeries,
  resolveGranularityMinutes,
} from '../mock/dashboardMock';
import type { DashboardData, DashboardFilters } from '../types/dashboard';

export { createDefaultFilters };

export async function fetchDashboardData(filters: DashboardFilters): Promise<DashboardData> {
  const actualGranularityMinutes = resolveGranularityMinutes(filters.range);
  const timeseries = await mockTimeSeries(filters);
  const summaryEnd = new Date();
  const summaryStart = new Date(summaryEnd.getTime() - 10 * 60 * 1000);
  const summaryPoints = await mockTimeSeries({
    range: [summaryStart, summaryEnd],
    granularity: 'auto',
  });
  const [summary, apiRanking, serviceHealth, alerts] = await Promise.all([
    mockSummary(summaryPoints),
    mockApiRanking(timeseries),
    mockServiceHealth(timeseries),
    mockAlerts(timeseries),
  ]);

  return {
    actualGranularityMinutes,
    summary,
    timeseries,
    apiRanking,
    serviceHealth,
    alerts,
  };
}

export async function fetchCustomerLoadAttribution(
  selectedTimestamp: string,
  granularityMinutes: number,
  points: Awaited<ReturnType<typeof mockTimeSeries>>,
) {
  return mockCustomerLoadRanking(points, selectedTimestamp, granularityMinutes);
}

export async function fetchCustomerTrend(
  cid: string,
  granularityMinutes: number,
  points: Awaited<ReturnType<typeof mockTimeSeries>>,
) {
  return mockCustomerTrend(points, cid, granularityMinutes);
}
