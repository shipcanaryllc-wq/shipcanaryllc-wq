import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import './DailyOrdersChart.css';

const DailyOrdersChart = ({ orders = [] }) => {
  // Process orders into daily counts for last 30 days
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      // Return empty data for last 30 days
      const emptyData = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        emptyData.push({
          date: format(date, 'MMM dd'),
          fullDate: format(date, 'MMM dd, yyyy'),
          orders: 0
        });
      }
      return emptyData;
    }

    // Create a map of dates to order counts
    const dateMap = new Map();
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);

    // Initialize all dates in range with 0 orders
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, 29 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dateMap.set(dateKey, {
        date: format(date, 'MMM dd'),
        fullDate: format(date, 'MMM dd, yyyy'),
        orders: 0
      });
    }

    // Count orders per day
    orders.forEach(order => {
      if (!order.createdAt) return;
      const orderDate = startOfDay(new Date(order.createdAt));
      
      // Only include orders from last 30 days
      if (orderDate >= thirtyDaysAgo) {
        const dateKey = format(orderDate, 'yyyy-MM-dd');
        if (dateMap.has(dateKey)) {
          dateMap.get(dateKey).orders += 1;
        }
      }
    });

    // Convert map to array sorted by date
    return Array.from(dateMap.values());
  }, [orders]);

  // Calculate totals
  const totalOrders = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.orders, 0);
  }, [chartData]);

  const avgPerDay = useMemo(() => {
    return totalOrders > 0 ? (totalOrders / 30).toFixed(1) : '0.0';
  }, [totalOrders]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-label">{data.fullDate}</div>
          <div className="tooltip-value">
            <span className="tooltip-dot"></span>
            {data.orders} {data.orders === 1 ? 'order' : 'orders'}
          </div>
        </div>
      );
    }
    return null;
  };

  // Find max value for Y-axis
  const maxOrders = Math.max(...chartData.map(d => d.orders), 1);
  const yAxisMax = Math.ceil(maxOrders * 1.1); // Add 10% padding

  return (
    <div className="orders-chart-card">
      <div className="chart-header">
        <h3 className="card-title">Daily Orders (Last 30 Days)</h3>
        <div className="chart-stats">
          <div className="chart-stat">
            <span className="chart-stat-label">Total:</span>
            <span className="chart-stat-value">{totalOrders}</span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-label">Avg/Day:</span>
            <span className="chart-stat-value">{avgPerDay}</span>
          </div>
        </div>
      </div>
      
      {totalOrders === 0 ? (
        <div className="chart-empty-state">
          <p>No orders in the last 30 days</p>
          <div className="chart-empty-subtext">Orders will appear here once you create shipping labels</div>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, yAxisMax]}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#ff6b35"
                strokeWidth={2}
                fill="url(#colorOrders)"
                dot={{ fill: '#ff6b35', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DailyOrdersChart;



