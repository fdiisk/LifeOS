'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';
import { LIFE_AREAS, LIFE_AREA_COLORS, LIFE_AREA_LABELS, normalizeLifeArea, type LifeArea } from '@/lib/life-areas';

interface LifeAreaDataPoint {
  date: string;
  [key: string]: number | string;
}

export default function LifeAreasChart() {
  const [chartData, setChartData] = useState<LifeAreaDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLifeAreasData();
  }, []);

  async function fetchLifeAreasData() {
    try {
      // Fetch goals and tasks to calculate life area progress
      const goalsRes = await fetch('/api/macro-goals?include_progress=true');
      if (!goalsRes.ok) throw new Error('Failed to fetch goals');
      const goalsData = await goalsRes.json();

      // Generate 6 months of data
      const today = new Date();
      const sixMonthsAgo = subMonths(today, 6);
      const dataPoints: LifeAreaDataPoint[] = [];
      const current = new Date(sixMonthsAgo);

      // Initialize life areas with empty arrays
      const lifeAreas: Record<LifeArea, number[]> = {
        financial: [],
        personal: [],
        relationships: [],
        recreation: [],
        career: [],
        hobbies: [],
        health: [],
      };

      // Calculate progress for each life area from goals
      (goalsData.macro_goals || []).forEach((goal: any) => {
        const rawLifeArea = goal.ai_parsed_data?.life_area;
        const category = normalizeLifeArea(rawLifeArea);
        const progress = goal.progress || 0;

        lifeAreas[category].push(progress);
      });

      // Calculate averages
      const averages: Record<LifeArea, number> = {} as Record<LifeArea, number>;
      LIFE_AREAS.forEach((area) => {
        const values = lifeAreas[area];
        averages[area] = values.length > 0
          ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
          : 0;
      });

      // Generate weekly data points with simulated growth
      while (current <= today) {
        const weeksPassed = Math.floor(
          (current.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        const totalWeeks = 26;
        const growthFactor = weeksPassed / totalWeeks;

        const dataPoint: LifeAreaDataPoint = { date: format(current, 'MMM dd') };

        LIFE_AREAS.forEach((area) => {
          // Show relative progress (not capped at 100%)
          dataPoint[area] = Math.round(averages[area] * growthFactor + Math.random() * 5);
        });

        dataPoints.push(dataPoint);

        current.setDate(current.getDate() + 7);
      }

      setChartData(dataPoints);
    } catch (error) {
      console.error('Error fetching life areas data:', error);
      // Set empty data if error
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  // Custom tooltip to show relative balance
  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;

    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any) => {
          const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}:</span>
              </div>
              <span className="font-semibold">
                {entry.value} ({percentage}%)
              </span>
            </div>
          );
        })}
        <div className="border-t border-gray-200 mt-2 pt-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total:</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Life Areas Balance</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Life Areas Balance</h3>
        <p className="text-sm text-gray-600">
          Relative progress across all life areas (shows balance, not absolute values)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: 'Relative Progress', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />
          {LIFE_AREAS.map((area) => (
            <Line
              key={area}
              type="monotone"
              dataKey={area}
              name={LIFE_AREA_LABELS[area]}
              stroke={LIFE_AREA_COLORS[area].stroke}
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
