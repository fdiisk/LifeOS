'use client';

import { TimeScale } from '@/lib/dashboard-utils';

interface TimeScaleSelectorProps {
  selected: TimeScale;
  onChange: (scale: TimeScale) => void;
}

const scales: { value: TimeScale; label: string }[] = [
  { value: 'day', label: 'Week' },
  { value: 'week', label: 'Month' },
  { value: 'month', label: 'Quarter' },
  { value: 'quarter', label: '6 Months' },
  { value: 'year', label: 'Year' },
];

export default function TimeScaleSelector({ selected, onChange }: TimeScaleSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 bg-white p-4 rounded-lg shadow mb-6">
      <span className="text-sm font-medium text-gray-700 flex items-center mr-2">
        Time Scale:
      </span>
      {scales.map((scale) => (
        <button
          key={scale.value}
          onClick={() => onChange(scale.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selected === scale.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {scale.label}
        </button>
      ))}
    </div>
  );
}
