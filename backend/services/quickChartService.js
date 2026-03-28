const QUICKCHART_BASE_URL = 'https://quickchart.io/chart';

/**
 * Build a QuickChart URL from Chart.js config
 */
const buildChartUrl = ({ chartConfig, width = 700, height = 350, format = 'png', backgroundColor = 'white' }) => {
  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `${QUICKCHART_BASE_URL}?c=${encodedConfig}&w=${width}&h=${height}&f=${format}&bkg=${backgroundColor}`;
};

/**
 * Pie chart: corrective actions by status
 */
const correctiveStatusChart = (statusMap) => {
  const labels = ['open', 'in-progress', 'completed', 'verified', 'closed'];
  const data = labels.map((k) => statusMap[k] || 0);

  const chartConfig = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd']
      }]
    },
    options: {
      title: { display: true, text: 'Corrective Actions by Status' },
      legend: { position: 'bottom' }
    }
  };

  return buildChartUrl({ chartConfig, width: 500, height: 320 });
};

/**
 * Bar chart: corrective actions by priority
 */
const correctivePriorityChart = (priorityMap) => {
  const labels = ['low', 'medium', 'high', 'critical'];
  const data = labels.map((k) => priorityMap[k] || 0);

  const chartConfig = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Count',
        data,
        backgroundColor: ['#10ac84', '#54a0ff', '#ff9f43', '#ee5253']
      }]
    },
    options: {
      title: { display: true, text: 'Corrective Actions by Priority' },
      legend: { display: false },
      scales: { yAxes: [{ ticks: { beginAtZero: true, precision: 0 } }] }
    }
  };

  return buildChartUrl({ chartConfig, width: 600, height: 320 });
};

/**
 * Line chart: audits completed by month
 */
const auditsTimelineChart = (monthlyRows) => {
  const labels = monthlyRows.map((r) => r.label);
  const data = monthlyRows.map((r) => r.count);

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
        lineTension: 0.2
      }]
    },
    options: {
      title: { display: true, text: 'Completed Audits (Last 6 Months)' },
      scales: { yAxes: [{ ticks: { beginAtZero: true, precision: 0 } }] }
    }
  };

  return buildChartUrl({ chartConfig, width: 700, height: 320 });
};

module.exports = {
  correctiveStatusChart,
  correctivePriorityChart,
  auditsTimelineChart
};