import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { CrimeData, PoliceUnit } from '../types';

interface ComparisonTableProps {
  data: Record<PoliceUnit, {
    total: number;
    target: number;
    difference: number;
  }>;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow-lg">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unidade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total de Ocorrências
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Meta
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Diferença
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {(Object.entries(data) as [PoliceUnit, typeof data[PoliceUnit]][]).map(([unit, stats]) => (
            <tr key={unit} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  to={`/unit/${unit}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {unit}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {stats.total.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {stats.target.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`flex items-center ${
                  stats.difference > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {stats.difference > 0 ? (
                    <ArrowUpRight className="mr-1" size={16} />
                  ) : (
                    <ArrowDownRight className="mr-1" size={16} />
                  )}
                  {Math.abs(stats.difference).toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
