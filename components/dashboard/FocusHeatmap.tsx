'use client';

import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { fetchFocusHeatmap, FocusHeatmapData } from '@/lib/dashboard-utils';

export default function FocusHeatmap() {
  const [heatmapData, setHeatmapData] = useState<FocusHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmapData();
  }, []);

  async function loadHeatmapData() {
    try {
      const data = await fetchFocusHeatmap(14); // Last 14 days
      setHeatmapData(data);
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get unique days and hours
  const days = Array.from(new Set(heatmapData.map((d) => d.day))).sort().reverse().slice(0, 14);
  const hours = Array.from(new Set(heatmapData.map((d) => d.hour))).sort();

  // Get max value for color scaling
  const maxValue = Math.max(...heatmapData.map((d) => d.value), 1);

  // Get intensity color based on value
  const getColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100';
    const intensity = Math.min(value / maxValue, 1);
    if (intensity < 0.2) return 'bg-blue-200';
    if (intensity < 0.4) return 'bg-blue-300';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    return 'bg-blue-600';
  };

  // Get value for specific day and hour
  const getValue = (day: string, hour: number): number => {
    const entry = heatmapData.find((d) => d.day === day && d.hour === hour);
    return entry?.value || 0;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Focus Heatmap (Last 14 Days)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Focus Heatmap (Last 14 Days)</h3>
      <p className="text-sm text-gray-600 mb-4">
        Darker colors indicate more focus time in that hour
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-20 flex-shrink-0" />
            {hours.map((hour) => (
              <div
                key={hour}
                className="w-8 h-8 flex items-center justify-center text-xs text-gray-600"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map((day) => (
            <div key={day} className="flex mb-1">
              <div className="w-20 flex-shrink-0 flex items-center text-xs text-gray-600">
                {format(new Date(day), 'MMM dd')}
              </div>
              {hours.map((hour) => {
                const value = getValue(day, hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-8 h-8 m-0.5 rounded ${getColor(value)} cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${format(new Date(day), 'MMM dd')} at ${hour}:00 - ${value} minutes`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded" />
          <div className="w-4 h-4 bg-blue-200 rounded" />
          <div className="w-4 h-4 bg-blue-300 rounded" />
          <div className="w-4 h-4 bg-blue-400 rounded" />
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <div className="w-4 h-4 bg-blue-600 rounded" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
