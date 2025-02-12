import React from 'react';
import type { Filters, CrimeType } from '../types';
import { TimeRangeSelector } from './TimeRangeSelector';

interface FiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange }) => {
  const crimeTypes: (CrimeType | 'all')[] = [
    'all',
    'Letalidade Violenta',
    'Roubo de Veículo',
    'Roubo de Rua',
    'Roubo de Carga'
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <TimeRangeSelector
            value={filters.timeRange}
            onChange={(timeRange) => onFilterChange({ ...filters, timeRange })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Crime
          </label>
          <select
            value={filters.crimeType}
            onChange={(e) => onFilterChange({
              ...filters,
              crimeType: e.target.value as CrimeType | 'all'
            })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {crimeTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'Todos' : type}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
