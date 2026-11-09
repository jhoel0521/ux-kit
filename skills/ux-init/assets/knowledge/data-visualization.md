# Data visualization and dashboards

Applies to any charting library (Recharts, Chart.js, ECharts, D3, Highcharts, ApexCharts, Plotly, MPAndroidChart, Vico, Swift Charts, fl_chart, LiveCharts, JFreeChart…).

## Choosing a chart
| Question | Chart |
|---|---|
| How does it change over time? | Line (continuous), columns (few discrete periods) |
| Which is bigger? | Sorted horizontal bars (long labels), columns (few categories) |
| Part of the total? | 100% stacked bar or bars; pie/donut only with 2–5 parts and clear differences |
| Distribution? | Histogram, box plot |
| Relationship? | Scatter |
| One number matters now | KPI tile: value + comparison (previous period or goal) + sparkline |
| Where? | Map, only if geography matters |
Avoid 3D, dual axes (unless clearly labeled), 10-slice pies, space-hungry gauges.

## Rules
- Bars start at 0. Units in axis titles or chart title.
- Direct labels instead of distant legends when ≤ 5 series.
- One series = one consistent color across the dashboard; colorblind-safe categorical palettes (Okabe-Ito, Tableau 10 CB); ≤ 6–8 categories, group the rest as "Other".
- Marks vs background ≥ 3:1; distinguish series by shape/pattern/label too.
- Chart text ≥ 12px; tabular figures; locale formats.
- Remove heavy grids, borders and backgrounds.
- States: loading skeleton, no data ("No sales in this period"), error, partial data (mark incomplete period).
- Tooltips on hover **and** focus/tap; never exclusive information in tooltips.

## Accessibility of charts
- Title + text summary of the takeaway.
- Data table alternative ("View as table").
- Static SVG with `role="img"` + accessible name; interactive charts keyboard-navigable when interaction is essential.
- Native: chart accessibility label with summary; Swift Charts `AXChartDescriptor` (Audio Graphs).

## Dashboards
- Question first: each dashboard answers 3–5 questions for one role.
- Hierarchy: key KPIs top-left; detail below; global filters visible with active state.
- 5–9 visualizations per view is usually the useful limit; the rest in tabs or drill-down.
- Context on every number: comparison, goal, period, last update.
- Consistent date ranges and colors for the same metric.
- From insight to action: link to the filtered list, export.
- Mobile: stacked KPIs, simplified charts, tables to cards.
- Aggregate on the backend; downsample long series (LTTB).
