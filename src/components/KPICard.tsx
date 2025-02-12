import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { KPI } from '../types';

interface KPICardProps {
  kpi: KPI;
  color: string;
  unit?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, color, unit }) => {
  const navigate = useNavigate();
  const isPositive = kpi.trend > 0;

  const handleClick = () => {
    if (unit) {
      navigate(`/unit/${encodeURIComponent(unit)}`);
    }
  };

  return (
    <div 
      className={`${color} rounded-lg p-6 shadow-lg text-white ${unit ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-white/90 text-sm font-medium">{kpi.label}</span>
        <span className={`flex items-center ${isPositive ? 'text-red-200' : 'text-green-200'}`}>
          {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          {Math.abs(kpi.trend)}%
        </span>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold">{kpi.value.toLocaleString()}</span>
      </div>
      <div className="mt-2 text-sm text-white/75">
        Meta: {kpi.target.toLocaleString()}
      </div>
    </div>
  );
};
