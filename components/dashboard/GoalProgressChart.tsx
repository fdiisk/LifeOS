'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface GoalData {
  id: string;
  title: string;
  progress: number;
  status: string;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export default function GoalProgressChart() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoalsData();
  }, []);

  async function fetchGoalsData() {
    try {
      const res = await fetch('/api/macro-goals?status=active&include_progress=true');
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json();

      const activeGoals = (data.macro_goals || []).slice(0, 5); // Limit to 5 goals for visibility
      setGoals(activeGoals);

      // Generate 6 months of data points
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);

      const dataPoints: ChartDataPoint[] = [];
      const current = new Date(sixMonthsAgo);

      // Generate weekly data points
      while (current <= today) {
        const point: ChartDataPoint = {
          date: format(current, 'MMM dd'),
        };

        // Simulate progress growth for each goal
        activeGoals.forEach((goal: GoalData) => {
          const weeksPassed = Math.floor(
            (current.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24 * 7)
          );
          const totalWeeks = 26; // ~6 months
          const progressGrowth = (goal.progress || 0) * (weeksPassed / totalWeeks);
          point[goal.title] = Math.min(100, Math.round(progressGrowth));
        });

        dataPoints.push(point);
        current.setDate(current.getDate() + 7); // Weekly increments
      }

      setChartData(dataPoints);
    } catch (error) {
      console.error('Error fetching goals data:', error);
    } finally {
      setLoading(false);
    }
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Long-term Goal Progress (6 Months)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Long-term Goal Progress (6 Months)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No active goals found. Create macro goals to see progress here.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Long-term Goal Progress (6 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {goals.map((goal, index) => (
            <Line
              key={goal.id}
              type="monotone"
              dataKey={goal.title}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
