'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
          dataPoint[area] = Math.min(100, Math.round(averages[area] * growthFactor + Math.random() * 10));
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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Life Areas Progress (Normalized)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Life Areas Progress (Normalized)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
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
          {LIFE_AREAS.map((area) => (
            <Area
              key={area}
              type="monotone"
              dataKey={area}
              name={LIFE_AREA_LABELS[area]}
              stackId="1"
              stroke={LIFE_AREA_COLORS[area].stroke}
              fill={LIFE_AREA_COLORS[area].fill}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
