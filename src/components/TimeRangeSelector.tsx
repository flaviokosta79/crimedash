import React from 'react';
import type { TimeRange } from '../types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const ranges: Array<{ value: TimeRange; label: string }> = [
    { value: '7D', label: '7 dias' },
    { value: '15D', label: '15 dias' },
    { value: '30D', label: '30 dias' },
    { value: '90D', label: '90 dias' },
    { value: '180D', label: '6 meses' },
    { value: '1Y', label: '1 ano' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          className={`px-4 py-2 rounded-md transition-colors ${
            value === range.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};
