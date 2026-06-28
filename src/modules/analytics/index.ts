export interface MetricTrend {
  label: string;
  value: number;
  changePct: number;
}

export function formatMetricTrend(value: number, previous: number, label: string): MetricTrend {
  const changePct = previous > 0 ? ((value - previous) / previous) * 100 : 0;
  return {
    label,
    value,
    changePct
  };
}
