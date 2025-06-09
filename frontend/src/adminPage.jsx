import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://daniankebubbi.onrender.com';

if (!API_BASE_URL) {
  console.warn(
    '⚠️ REACT_APP_API_BASE_URL is not defined. Check your .env file.',
  );
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const AdminPage = () => {
  const [analyticsData, setAnalyticsData] = useState({
    hourlyTrends: [],
    dailyVolume: [],
    busyHours: [],
    busyDays: [],
    todayStats: null,
    overallStats: null,
    popularItems: { popular_items: [], stats: {} },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL ||
        'https://daniankebubbi.onrender.com';

      if (!API_BASE_URL) {
        console.warn(
          '⚠️ REACT_APP_API_BASE_URL is not defined. Check your .env file.',
        );
      }

      // First fetch for hourly trends
      const hourlyTrends = await fetch(
        `${API_BASE_URL}/api/analytics/hourly-trends`,
      ).then((res) => res.json());

      // Other analytics endpoints
      const dailyVolume = await fetch(
        `${API_BASE_URL}/api/analytics/daily-volume`,
      ).then((res) => res.json());
      const busyHours = await fetch(
        `${API_BASE_URL}/api/analytics/busy-hours`,
      ).then((res) => res.json());
      const busyDays = await fetch(
        `${API_BASE_URL}/api/analytics/busy-days`,
      ).then((res) => res.json());
      const popularItems = await fetch(
        `${API_BASE_URL}/api/analytics/popular-items`,
      ).then((res) => res.json());

      // Today's and overall stats
      const todayCompletion = await fetch(
        `${API_BASE_URL}/api/orders/completed/today`,
      ).then((res) => res.json());
      const overallStats = await fetch(
        `${API_BASE_URL}/api/orders/completed/total`,
      ).then((res) => res.json());

      setAnalyticsData({
        hourlyTrends,
        dailyVolume,
        busyHours,
        busyDays,
        popularItems,
        todayStats: todayCompletion,
        overallStats,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const hourlyChartData = {
    labels: analyticsData.hourlyTrends.map((item) => `${item.hour}:00`),
    datasets: [
      {
        label: 'Orders',
        data: analyticsData.hourlyTrends.map((item) => item.order_count),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Avg Time (min)',
        data: analyticsData.hourlyTrends.map(
          (item) => item.avg_preparation_time,
        ),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const dailyChartData = {
    labels: analyticsData.dailyVolume.map((item) => item.date),
    datasets: [
      {
        label: 'Daily Orders',
        data: analyticsData.dailyVolume.map((item) => item.order_count),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const busyHoursChartData = {
    labels: analyticsData.busyHours.map((item) => `${item.hour}:00`),
    datasets: [
      {
        label: 'Busiest Hours',
        data: analyticsData.busyHours.map((item) => item.order_count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(234, 88, 12, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(20, 184, 166, 0.6)',
          'rgba(6, 182, 212, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(234, 88, 12, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(6, 182, 212, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const busyDaysChartData = {
    labels: analyticsData.busyDays.map((item) => item.day_name),
    datasets: [
      {
        label: 'Orders by Day',
        data: analyticsData.busyDays.map((item) => item.order_count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(234, 88, 12, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(20, 184, 166, 0.6)',
          'rgba(6, 182, 212, 0.6)',
          'rgba(124, 58, 237, 0.6)',
          'rgba(219, 39, 119, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(234, 88, 12, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(124, 58, 237, 1)',
          'rgba(219, 39, 119, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Process popular items data
  const popularItemsChartData = {
    labels:
      analyticsData.popularItems.popular_items?.map((item) => item.item_name) ||
      [],
    datasets: [
      {
        label: 'Order Count',
        data:
          analyticsData.popularItems.popular_items?.map(
            (item) => item.order_count,
          ) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Orders"
            value={analyticsData.todayStats?.completed_orders_today || 0}
            change="+12%"
            icon="📊"
          />
          <StatCard
            title="Avg. Time Today"
            value={`${
              analyticsData.todayStats?.avg_completion_time_minutes || 0
            } min`}
            change="-5%"
            icon="⏱️"
          />
          <StatCard
            title="Total Orders"
            value={analyticsData.overallStats?.completed_orders_total || 0}
            icon="📦"
          />
          <StatCard
            title="Avg. Time Overall"
            value={`${
              analyticsData.overallStats?.avg_completion_time_minutes || 0
            } min`}
            change="-8%"
            icon="⏳"
          />
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hourly Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Hourly Trends</h2>
            <div className="h-64">
              <Bar
                data={hourlyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Number of Orders' },
                    },
                    y1: {
                      beginAtZero: true,
                      position: 'right',
                      title: { display: true, text: 'Avg. Time (min)' },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Daily Volume */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Daily Volume (Last 30 Days)
            </h2>
            <div className="h-64">
              <Line
                data={dailyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Busiest Hours */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Busiest Hours</h2>
            <div className="h-64">
              <Pie
                data={busyHoursChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          {/* Busiest Days */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Busiest Days</h2>
            <div className="h-64">
              <Bar
                data={busyDaysChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                }}
              />
            </div>
          </div>
        </div>
        {/* Popular Items Section */}
       
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Most Popular Menu Items
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <p>Loading popular items...</p>
            </div>
          ) : analyticsData.popularItems.popular_items?.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p>No popular items data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 lg:h-80">
                <Bar
                  data={popularItemsChartData}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const item =
                              analyticsData.popularItems.popular_items[
                                context.dataIndex
                              ];
                            return [
                              `Orders: ${item.order_count}`,
                              `Percentage: ${item.percentage_of_total}% of total`,
                            ];
                          },
                        },
                      },
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Orders',
                        },
                      },
                      y: {
                        ticks: {
                          autoSkip: false,
                        },
                      },
                    },
                  }}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-3">Item Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Items Processed
                    </p>
                    <p className="text-xl font-semibold">
                      {analyticsData.popularItems.stats
                        ?.total_items_processed || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Orders Analyzed
                    </p>
                    <p className="text-xl font-semibold">
                      {analyticsData.popularItems.stats
                        ?.total_orders_processed || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Skipped Items</p>
                    <p className="text-xl font-semibold">
                      {analyticsData.popularItems.stats?.skipped_items || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
    {change && (
      <div
        className={`mt-2 flex items-center ${
          change.startsWith('+') ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {change.startsWith('+') ? (
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
        <span className="text-sm font-medium">{change}</span>
      </div>
    )}
  </div>
);

export default AdminPage;
