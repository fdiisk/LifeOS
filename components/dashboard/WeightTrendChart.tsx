'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, subMonths, eachDayOfInterval, parseISO } from 'date-fns';

interface WeightDataPoint {
  date: string;
  expectedWeight: number | null;
  actualWeight: number | null;
  netCalories: number | null;
}

export default function WeightTrendChart() {
  const [chartData, setChartData] = useState<WeightDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchWeightTrendData();
  }, []);

  async function fetchWeightTrendData() {
    try {
      // Fetch user settings for BMR calculations
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      const userSettings = settingsData.data;
      setSettings(userSettings);

      // Generate last 3 months of data
      const today = new Date();
      const threeMonthsAgo = subMonths(today, 3);
      const dateRange = eachDayOfInterval({ start: threeMonthsAgo, end: today });

      // Calculate BMR using Mifflin-St Jeor equation
      const bmr = calculateBMR(
        userSettings.current_weight_kg,
        userSettings.height_cm,
        userSettings.age
      );

      const dataPoints: WeightDataPoint[] = [];
      let expectedWeight = userSettings.current_weight_kg || 70;

      for (const date of dateRange) {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Calculate expected weight based on target deficit
        // 1 kg fat = ~7700 calories
        const dailyDeficit = userSettings.target_deficit_calories || 0;
        const weightChangePerDay = dailyDeficit / 7700;

        if (userSettings.goal_weight_kg && userSettings.current_weight_kg) {
          if (userSettings.goal_weight_kg < userSettings.current_weight_kg) {
            expectedWeight -= weightChangePerDay;
          } else {
            expectedWeight += weightChangePerDay;
          }
        }

        dataPoints.push({
          date: format(date, 'MMM dd'),
          expectedWeight: Math.round(expectedWeight * 10) / 10,
          actualWeight: null, // Will be filled with actual data
          netCalories: null,
        });
      }

      setChartData(dataPoints);
    } catch (error) {
      console.error('Error fetching weight trend data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  function calculateBMR(weight: number | null, height: number | null, age: number | null): number {
    if (!weight || !height || !age) return 1800; // Default

    // Mifflin-St Jeor equation (assuming male for now)
    // BMR = 10 × weight (kg) + 6.25 × height (cm) − 5 × age (years) + 5
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  }

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any) => {
          if (entry.value === null) return null;
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </div>
              <span className="font-semibold">
                {entry.dataKey === 'netCalories'
                  ? `${entry.value} cal`
                  : `${entry.value} kg`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Weight Trend Analysis</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!settings?.current_weight_kg || !settings?.goal_weight_kg) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Weight Trend Analysis</h3>
        <div className="h-64 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="mb-2">Configure your health settings to see weight trends</p>
            <a href="/settings" className="text-blue-600 hover:text-blue-700 underline">
              Go to Settings
            </a>
          </div>
        </div>
      </div>
    );
  }

  const goalWeight = settings.goal_weight_kg;

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Weight Trend Analysis</h3>
        <p className="text-sm text-gray-600">
          Expected vs actual weight based on BMR and calorie deficit
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded" />
          <span>Expected Weight (based on deficit)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 rounded" />
          <span>Actual Weight (logged)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500 border-t-2 border-dashed border-red-500" />
          <span>Goal Weight</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveEnd"
            stroke="#6b7280"
          />
          <YAxis
            label={{
              value: 'Weight (kg)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 },
            }}
            domain={['auto', 'auto']}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />
          <ReferenceLine
            y={goalWeight}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: `Goal: ${goalWeight}kg`,
              position: 'right',
              fill: '#ef4444',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="expectedWeight"
            name="Expected Weight"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="actualWeight"
            name="Actual Weight"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-600">Current</p>
          <p className="text-lg font-semibold text-gray-900">
            {settings.current_weight_kg} kg
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Goal</p>
          <p className="text-lg font-semibold text-gray-900">{goalWeight} kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">To Goal</p>
          <p className="text-lg font-semibold text-blue-600">
            {Math.abs(Math.round((settings.current_weight_kg - goalWeight) * 10) / 10)} kg
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Daily Deficit</p>
          <p className="text-lg font-semibold text-orange-600">
            {settings.target_deficit_calories || 0} cal
          </p>
        </div>
      </div>
    </div>
  );
}
