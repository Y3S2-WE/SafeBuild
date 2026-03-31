const QUICKCHART_BASE_URL = process.env.QUICKCHART_BASE_URL || 'https://quickchart.io/chart';
const SUPPORTED_FORMATS = new Set(['png', 'svg', 'webp', 'pdf']);

const STATUS_META = [
  { key: 'open', label: 'Open', color: '#ef4444' },
  { key: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'completed', label: 'Completed', color: '#0ea5e9' },
  { key: 'verified', label: 'Verified', color: '#10b981' },
  { key: 'closed', label: 'Closed', color: '#6366f1' }
];

const PRIORITY_META = [
  { key: 'low', label: 'Low', color: '#10b981' },
  { key: 'medium', label: 'Medium', color: '#3b82f6' },
  { key: 'high', label: 'High', color: '#f59e0b' },
  { key: 'critical', label: 'Critical', color: '#ef4444' }
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const clampInteger = (value, { min, max, fallback }) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const normalizeCount = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
};

const buildBaseChartOptions = (title) => ({
  title: {
    display: true,
    text: title,
    fontColor: '#111827',
    fontSize: 14,
    padding: 16
  },
  legend: {
    position: 'bottom',
    labels: {
      fontColor: '#374151',
      boxWidth: 12
    }
  }
});

const buildTimelineRows = (inputRows = []) => {
  const countsByLabel = new Map(
    inputRows
      .filter((row) => row && typeof row.label === 'string')
      .map((row) => [row.label, normalizeCount(row.count)])
  );

  const rows = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    rows.push({
      label,
      count: countsByLabel.get(label) || 0
    });
  }

  return rows;
};

const buildSeriesFromMeta = (meta, valueMap = {}, { hideZeroValues = true } = {}) => {
  const rows = meta.map((item) => ({
    label: item.label,
    color: item.color,
    value: normalizeCount(valueMap?.[item.key])
  }));

  const filtered = hideZeroValues
    ? rows.filter((row) => row.value > 0)
    : rows;

  const finalRows = filtered.length > 0 ? filtered : rows;

  return {
    labels: finalRows.map((row) => row.label),
    data: finalRows.map((row) => row.value),
    backgroundColor: finalRows.map((row) => row.color),
    total: rows.reduce((sum, row) => sum + row.value, 0)
  };
};

/**
 * Build a QuickChart URL from Chart.js config
 * @param {Object} params - Configuration parameters
 * @param {Object} params.chartConfig - Chart.js configuration object
 * @param {number} params.width - Chart width in pixels (default: 700, min: 200, max: 2000)
 * @param {number} params.height - Chart height in pixels (default: 350, min: 200, max: 2000)
 * @param {string} params.format - Output format: png|svg|webp|pdf (default: png)
 * @param {string} params.backgroundColor - Background color (default: white)
 * @param {number} params.devicePixelRatio - Pixel density (default: 2, min: 1, max: 3)
 * @returns {string} QuickChart API URL with encoded chart configuration
 */
const buildChartUrl = ({
  chartConfig,
  width = 700,
  height = 350,
  format = 'png',
  backgroundColor = 'white',
  devicePixelRatio = 2
}) => {
  if (!chartConfig || typeof chartConfig !== 'object') {
    throw new Error('chartConfig is required and must be an object');
  }

  const safeWidth = clampInteger(width, { min: 200, max: 2000, fallback: 700 });
  const safeHeight = clampInteger(height, { min: 200, max: 2000, fallback: 350 });
  const safeDevicePixelRatio = clampInteger(devicePixelRatio, { min: 1, max: 3, fallback: 2 });
  const safeFormat = SUPPORTED_FORMATS.has(String(format).toLowerCase())
    ? String(format).toLowerCase()
    : 'png';

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  const encodedBackground = encodeURIComponent(backgroundColor);

  return `${QUICKCHART_BASE_URL}?c=${encodedConfig}&w=${safeWidth}&h=${safeHeight}&f=${safeFormat}&bkg=${encodedBackground}&devicePixelRatio=${safeDevicePixelRatio}`;
};

/**
 * Doughnut chart: corrective actions by status
 * Visualizes the breakdown of corrective actions across lifecycle states:
 * Open → In Progress → Completed → Verified → Closed
 * @param {Object} statusMap - Map of status keys to counts
 * @returns {string} QuickChart URL for doughnut chart
 */
const correctiveStatusChart = (statusMap) => {
  const { labels, data, backgroundColor, total } = buildSeriesFromMeta(STATUS_META, statusMap);
  const hasData = total > 0;

  const chartConfig = {
    type: 'doughnut',
    data: {
      labels: hasData ? labels : ['No data'],
      datasets: [{
        data: hasData ? data : [1],
        backgroundColor: hasData ? backgroundColor : ['#d1d5db'],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      ...buildBaseChartOptions('How Many Actions by Status'),
      cutoutPercentage: 62,
      legend: {
        position: 'bottom',
        labels: {
          fontColor: '#374151',
          boxWidth: 12
        }
      }
    }
  };

  return buildChartUrl({ chartConfig, width: 500, height: 320 });
};

/**
 * Bar chart: corrective actions by priority
 * Displays workload distribution across priority levels.
 * Helps managers prioritize resource allocation based on criticality.
 * @param {Object} priorityMap - Map of priority keys to counts
 * @returns {string} QuickChart URL for bar chart
 */
const correctivePriorityChart = (priorityMap) => {
  const { labels, data, backgroundColor, total } = buildSeriesFromMeta(PRIORITY_META, priorityMap);
  const hasData = total > 0;

  const chartConfig = {
    type: 'bar',
    data: {
      labels: hasData ? labels : ['No data'],
      datasets: [{
        label: 'Count',
        data: hasData ? data : [0],
        backgroundColor: hasData ? backgroundColor : ['#d1d5db'],
        borderRadius: 6,
        maxBarThickness: 64
      }]
    },
    options: {
      ...buildBaseChartOptions('Priority Workload'),
      legend: { display: false },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            precision: 0,
            stepSize: 1,
            suggestedMax: hasData ? undefined : 1,
            fontColor: '#4b5563'
          },
          gridLines: {
            color: '#e5e7eb'
          }
        }],
        xAxes: [{
          ticks: {
            fontColor: '#4b5563'
          },
          gridLines: {
            display: false
          }
        }]
      }
    }
  };

  return buildChartUrl({ chartConfig, width: 600, height: 320 });
};

/**
 * Line chart: audits completed by month
 * Visualizes audit completion trend over the last 6 months.
 * Helps identify seasonal patterns and compliance progress.
 * @param {Array} monthlyRows - Array of {label, count} for monthly audit completions
 * @returns {string} QuickChart URL for line chart
 */
const auditsTimelineChart = (monthlyRows) => {
  const rows = buildTimelineRows(monthlyRows);
  const labels = rows.map((row) => row.label);
  const data = rows.map((row) => row.count);

  const chartConfig = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Completed Audits',
        data,
        fill: false,
        borderColor: '#2e86de',
        pointBackgroundColor: '#2e86de',
        pointRadius: 3,
        lineTension: 0.2,
        borderWidth: 3
      }]
    },
    options: {
      ...buildBaseChartOptions('Audit Completion Trend (Last 6 Months)'),
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            precision: 0,
            stepSize: 1,
            fontColor: '#4b5563'
          },
          gridLines: {
            color: '#e5e7eb'
          }
        }],
        xAxes: [{
          ticks: {
            fontColor: '#4b5563'
          },
          gridLines: {
            display: false
          }
        }]
      }
    }
  };

  return buildChartUrl({ chartConfig, width: 700, height: 320 });
};

module.exports = {
  correctiveStatusChart,
  correctivePriorityChart,
  auditsTimelineChart
};