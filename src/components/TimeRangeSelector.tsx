import React from 'react';
import type { TimeRange } from '../types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const ranges: TimeRange[] = ['D', 'W', 'M', '6M', 'Y'];

  return (
    <div className="flex space-x-2 bg-white rounded-lg p-1 shadow">
      {ranges.map((range) => (
        <button
          key={range}
          className={`px-4 py-2 rounded-md ${
            value === range
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
};
