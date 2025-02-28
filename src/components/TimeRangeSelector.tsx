import React from 'react';
import type { TimeRange } from '../types';

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onChange: (newRange: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  timeRange,
  onChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange('7D')}
        className={`px-3 py-1 text-sm rounded-md ${
          timeRange === '7D'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        7D
      </button>
      <button
        onClick={() => onChange('30D')}
        className={`px-3 py-1 text-sm rounded-md ${
          timeRange === '30D'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        30D
      </button>
      <button
        onClick={() => onChange('90D')}
        className={`px-3 py-1 text-sm rounded-md ${
          timeRange === '90D'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        90D
      </button>
    </div>
  );
};
