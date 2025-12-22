'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fetchRatingsComparison, TimeScale } from '@/lib/dashboard-utils';

interface RatingsComparisonChartProps {
  timeScale?: TimeScale;
}

interface ChartDataPoint {
  date: string;
  Subjective: number;
  Objective: number;
}

export default function RatingsComparisonChart({ timeScale = 'month' }: RatingsComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    avgGap: number;
    category: string;
  } | null>(null);

  useEffect(() => {
    loadComparisonData();
  }, [timeScale]);

  async function loadComparisonData() {
    setLoading(true);
    try {
      const data = await fetchRatingsComparison(timeScale);

      const formattedData: ChartDataPoint[] = data.map((item) => ({
        date: format(new Date(item.date), 'MMM dd'),
        Subjective: item.subjective,
        Objective: item.objective,
      }));

      setChartData(formattedData);

      // Calculate summary
      if (data.length > 0) {
        const avgGap =
          data.reduce((sum, item) => sum + Math.abs(item.gap), 0) / data.length;
        const overestimating = data.filter((item) => item.gap > 15).length;
        const underestimating = data.filter((item) => item.gap < -15).length;

        let category = 'Accurate';
        if (overestimating > underestimating) {
          category = 'Overestimating';
        } else if (underestimating > overestimating) {
          category = 'Underestimating';
        }

        setSummary({
          avgGap: Math.round(avgGap),
          category,
        });
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Perceived vs Actual Performance</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Perceived vs Actual Performance</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No rating data available. Start rating your days to see this comparison.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h3 className="text-lg font-semibold">Perceived vs Actual Performance</h3>
        {summary && (
          <div className="mt-2 md:mt-0 text-sm">
            <span className="text-gray-600">Avg Gap: </span>
            <span className="font-semibold">{summary.avgGap} pts</span>
            <span className="ml-3 text-gray-600">Tendency: </span>
            <span
              className={`font-semibold ${
                summary.category === 'Accurate'
                  ? 'text-green-600'
                  : summary.category === 'Overestimating'
                  ? 'text-orange-600'
                  : 'text-blue-600'
              }`}
            >
              {summary.category}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="Subjective"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Subjective (Perceived Effort)"
          />
          <Line
            type="monotone"
            dataKey="Objective"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Objective (Actual Performance)"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
        <p className="font-medium mb-1">Understanding the Gap:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            <span className="text-orange-600 font-medium">Lines above each other</span>: You feel
            you&apos;re working harder than results show
          </li>
          <li>
            <span className="text-blue-600 font-medium">Lines below each other</span>: You&apos;re
            achieving more than you give yourself credit for
          </li>
          <li>
            <span className="text-green-600 font-medium">Lines close together</span>: Your
            perception aligns well with reality
          </li>
        </ul>
      </div>
    </div>
  );
}
