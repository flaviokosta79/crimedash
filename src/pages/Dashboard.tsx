import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Filters } from '../components/Filters';
import { ImportButton } from '../components/ImportButton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Filters as FiltersType, PoliceUnit } from '../types';
import { supabase } from '../config/supabase';

interface DashboardData {
  units: Record<string, {
    total: number;
    lethal_violence: number;
    street_robbery: number;
    vehicle_robbery: number;
    cargo_robbery: number;
  }>;
  timeseries: Array<{
    date: string;
    unit: string;
    count: number;
  }>;
}

export const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FiltersType>({
    timeRange: 'M',
    crimeType: 'all'
  });

  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    units: {
      'AISP 10': {
        total: 0,
        lethal_violence: 0,
        street_robbery: 0,
        vehicle_robbery: 0,
        cargo_robbery: 0
      },
      'AISP 28': {
        total: 0,
        lethal_violence: 0,
        street_robbery: 0,
        vehicle_robbery: 0,
        cargo_robbery: 0
      },
      'AISP 33': {
        total: 0,
        lethal_violence: 0,
        street_robbery: 0,
        vehicle_robbery: 0,
        cargo_robbery: 0
      },
      'AISP 37': {
        total: 0,
        lethal_violence: 0,
        street_robbery: 0,
        vehicle_robbery: 0,
        cargo_robbery: 0
      },
      'AISP 43': {
        total: 0,
        lethal_violence: 0,
        street_robbery: 0,
        vehicle_robbery: 0,
        cargo_robbery: 0
      }
    },
    timeseries: [
      {
        date: new Date().toISOString().split('T')[0],
        'AISP 10': 0,
        'AISP 28': 0,
        'AISP 33': 0,
        'AISP 37': 0,
        'AISP 43': 0
      }
    ]
  });

  const navigate = useNavigate();

  // Metas por tipo de crime (mensais)
  const crimeTargets: Record<string, number> = {
    'letalidade violenta': 10,
    'roubo de rua': 100,
    'roubo de veículo': 50,
    'roubo de carga': 20
  };

  // Calcular meta total baseada no tipo de crime selecionado
  const calculateTarget = (crimeType: string) => {
    if (crimeType === 'all') {
      return Object.values(crimeTargets).reduce((sum, target) => sum + target, 0);
    }
    return crimeTargets[crimeType] || 0;
  };

  const battalionColors: Record<PoliceUnit, string> = {
    'AISP 10': 'bg-blue-600',
    'AISP 28': 'bg-orange-600',
    'AISP 33': 'bg-green-600',
    'AISP 37': 'bg-red-600',
    'AISP 43': 'bg-purple-600'
  };

  const defaultUnits = {
    'AISP 10': { total: 0, lethal_violence: 0, street_robbery: 0, vehicle_robbery: 0, cargo_robbery: 0 },
    'AISP 28': { total: 0, lethal_violence: 0, street_robbery: 0, vehicle_robbery: 0, cargo_robbery: 0 },
    'AISP 33': { total: 0, lethal_violence: 0, street_robbery: 0, vehicle_robbery: 0, cargo_robbery: 0 },
    'AISP 37': { total: 0, lethal_violence: 0, street_robbery: 0, vehicle_robbery: 0, cargo_robbery: 0 },
    'AISP 43': { total: 0, lethal_violence: 0, street_robbery: 0, vehicle_robbery: 0, cargo_robbery: 0 }
  };

  useEffect(() => {
    const fetchTargets = async () => {
      const { data: targetsData, error } = await supabase
        .from('targets')
        .select('*')
        .eq('year', 2025)
        .eq('semester', 1);

      if (error) {
        console.error('Erro ao buscar metas:', error);
        return;
      }

      // Organizar metas por unidade e tipo de crime
      const targetsByUnit = targetsData.reduce((acc: any, target) => {
        if (!acc[target.unit]) {
          acc[target.unit] = {};
        }
        acc[target.unit][target.crime_type] = target.target_value;
        return acc;
      }, {});

      setTargets(targetsByUnit);
    };

    fetchTargets();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados diretamente da tabela crimes
        const { data: crimes, error: crimesError } = await supabase
          .from('crimes')
          .select('*')
          .order('data_fato', { ascending: false });

        if (crimesError) {
          console.error('Erro ao buscar crimes:', crimesError);
          setError(crimesError.message);
          return;
        }

        // Agrupar dados por unidade
        const unitData = crimes?.reduce((acc: any, crime: any) => {
          const unit = crime.aisp;
          
          if (!acc[unit]) {
            acc[unit] = {
              total: 0,
              lethal_violence: 0,
              street_robbery: 0,
              vehicle_robbery: 0,
              cargo_robbery: 0
            };
          }

          acc[unit].total++;

          const tipo = crime.indicador_estrategico?.toLowerCase() || '';
          switch (tipo) {
            case 'letalidade violenta':
              acc[unit].lethal_violence++;
              break;
            case 'roubo de rua':
              acc[unit].street_robbery++;
              break;
            case 'roubo de veículo':
              acc[unit].vehicle_robbery++;
              break;
            case 'roubo de carga':
              acc[unit].cargo_robbery++;
              break;
          }

          return acc;
        }, {});

        // Buscar série temporal
        const { data: timeseries, error: timeseriesError } = await supabase
          .from('crime_timeseries')
          .select('*')
          .order('date', { ascending: true })
          .limit(90); // últimos 90 dias

        if (timeseriesError) {
          console.error('Erro ao buscar série temporal:', timeseriesError);
          setError(timeseriesError.message);
          return;
        }

        // Organizar série temporal
        const timeseriesData = timeseries?.reduce((acc: any, row: any) => {
          const date = row.date.split('T')[0];
          if (!acc[date]) {
            acc[date] = { date };
          }
          acc[date][row.unit] = row.count;
          return acc;
        }, {});

        setData({
          units: { ...defaultUnits, ...unitData } || defaultUnits,
          timeseries: Object.values(timeseriesData || {})
        });
      } catch (err: any) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  // Calcular total do CPA
  const cpaTotal = Object.values(data.units).reduce((sum: number, unit: any) => sum + unit.total, 0);
  const cpaTarget = calculateTarget(filters.crimeType);
  const cpaTrend = cpaTotal === 0 ? 0 : ((cpaTotal - cpaTarget) / cpaTarget) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Analítico - 5o CPA</h1>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Filters filters={filters} onFilterChange={setFilters} />
                <ImportButton onImportSuccess={() => window.location.reload()} />
                <button
                  onClick={() => navigate('/targets')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Configurar Metas
                </button>
              </div>
            </div>

            {/* CPA Total Card */}
            <div className="mb-8">
              <div 
                className="bg-gray-800 text-white rounded-lg p-6 shadow-lg"
                onClick={() => {}}
              >
                <h3 className="text-lg font-semibold">5o CPA - Total de Ocorrências</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm">Letalidade Violenta</p>
                    <p className="text-xl font-bold">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + unit.lethal_violence, 0)}
                      <span className="text-sm font-normal ml-2">
                        Meta: {targets['RISP 5']?.['letalidade violenta'] || 0}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Roubo de Rua</p>
                    <p className="text-xl font-bold">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + unit.street_robbery, 0)}
                      <span className="text-sm font-normal ml-2">
                        Meta: {targets['RISP 5']?.['roubo de rua'] || 0}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Roubo de Veículo</p>
                    <p className="text-xl font-bold">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + unit.vehicle_robbery, 0)}
                      <span className="text-sm font-normal ml-2">
                        Meta: {targets['RISP 5']?.['roubo de veículo'] || 0}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Roubo de Carga</p>
                    <p className="text-xl font-bold">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + unit.cargo_robbery, 0)}
                      <span className="text-sm font-normal ml-2">
                        Meta: {targets['RISP 5']?.['roubo de carga'] || 0}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-300">
                  * Metas mensais para o 1º semestre de 2025
                </div>
              </div>
            </div>

            {/* Battalion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              {Object.entries(data.units).map(([unit, stats]: [string, any]) => (
                <Link
                  key={unit}
                  to={`/unit/${unit}`}
                  className="block"
                >
                  <div
                    className={`${battalionColors[unit as PoliceUnit]} text-white rounded-lg p-6 shadow-lg cursor-pointer transition-transform hover:scale-105`}
                  >
                    <h3 className="text-lg font-semibold">{unit}</h3>
                    <div className="space-y-2 mt-4">
                      <div>
                        <p className="text-sm">Letalidade</p>
                        <p className="text-lg font-bold">
                          {stats.lethal_violence}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['letalidade violenta'] || 0}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Roubo de Rua</p>
                        <p className="text-lg font-bold">
                          {stats.street_robbery}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['roubo de rua'] || 0}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Roubo de Veículo</p>
                        <p className="text-lg font-bold">
                          {stats.vehicle_robbery}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['roubo de veículo'] || 0}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Roubo de Carga</p>
                        <p className="text-lg font-bold">
                          {stats.cargo_robbery}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['roubo de carga'] || 0}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Time Series Chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Evolução por Batalhão</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeseries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const [year, month, day] = date.split('-');
                        return `${day}/${month}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(battalionColors).map((battalion) => (
                      <Line
                        key={battalion}
                        type="monotone"
                        dataKey={battalion}
                        name={battalion}
                        stroke={
                          battalion === 'AISP 10' ? '#1f77b4' :
                          battalion === 'AISP 28' ? '#ff7f0e' :
                          battalion === 'AISP 33' ? '#2ca02c' :
                          battalion === 'AISP 37' ? '#d62728' :
                          '#9467bd'
                        }
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
