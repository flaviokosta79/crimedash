import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ImportButton } from '../components/ImportButton';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { PoliceUnit } from '../types';
import { getSupabaseAdmin, supabase } from '../config/supabase';

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
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
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
    timeseries: []
  });
  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});
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

  const fetchData = async () => {
    try {
      setError(null);

      // Buscar metas
      const { data: targetsData, error } = await supabase
        .from('targets')
        .select('*')
        .eq('year', 2025)
        .eq('semester', 1);

      if (error) throw error;

      // Processar metas por unidade
      const unitData: Record<string, { total: number, target: number }> = {};
      targetsData?.forEach((target: any) => {
        unitData[target.unit] = {
          total: 0,
          target: target.target_value
        };
      });

      // Buscar todos os dados para os totais
      let queryTotals = supabase
        .from('crimes')
        .select('*');

      const { data: allCrimes, error: allCrimesError } = await queryTotals;

      if (allCrimesError) throw allCrimesError;

      // Inicializar contadores por unidade
      const unitTotals: Record<string, any> = {};
      ['AISP 10', 'AISP 28', 'AISP 33', 'AISP 37', 'AISP 43'].forEach(unit => {
        unitTotals[unit] = {
          total: 0,
          lethal_violence: 0,
          street_robbery: 0,
          vehicle_robbery: 0,
          cargo_robbery: 0
        };
      });

      // Processar todos os crimes para os totais
      allCrimes?.forEach((crime: any) => {
        const unit = crime.aisp;
        const indicator = crime.indicador_estrategico?.toLowerCase() || '';
        
        if (unit && unitTotals[unit]) {
          unitTotals[unit].total += 1;

          // Incrementar contadores específicos
          if (indicator.includes('letalidade')) {
            unitTotals[unit].lethal_violence += 1;
          }
          if (indicator.includes('roubo de rua')) {
            unitTotals[unit].street_robbery += 1;
          }
          if (indicator.includes('roubo de veículo')) {
            unitTotals[unit].vehicle_robbery += 1;
          }
          if (indicator.includes('roubo de carga')) {
            unitTotals[unit].cargo_robbery += 1;
          }
        }
      });

      // Buscar dados do período para o gráfico
      const endDate = new Date();
      const startDate = new Date();
      const days = parseInt(timeRange.replace(/[^0-9]/g, ''));
      startDate.setDate(startDate.getDate() - days);

      let queryGraph = supabase
        .from('crimes')
        .select('*')
        .gte('data_fato', startDate.toISOString().split('T')[0])
        .lte('data_fato', endDate.toISOString().split('T')[0])
        .order('data_fato', { ascending: true });

      const { data: periodCrimes, error: periodCrimesError } = await queryGraph;

      if (periodCrimesError) throw periodCrimesError;

      // Criar mapa de datas para o gráfico
      const dateMap: Record<string, any> = {};
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateMap[dateStr] = {
          date: dateStr,
          'AISP 10': 0,
          'AISP 28': 0,
          'AISP 33': 0,
          'AISP 37': 0,
          'AISP 43': 0
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Processar crimes do período para o gráfico
      periodCrimes?.forEach((crime: any) => {
        const unit = crime.aisp;
        const date = crime.data_fato ? crime.data_fato.split('T')[0] : null;
        
        if (date && dateMap[date] && unit) {
          dateMap[date][unit] = (dateMap[date][unit] || 0) + 1;
        }
      });

      setData({
        units: unitTotals,
        timeseries: Object.values(dateMap)
      });
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        let query = supabase
          .from('crimes')
          .select('*');

        const { data: crimes, error: crimesError } = await query.order('data_fato', { ascending: true });

        if (crimesError) {
          console.error('Erro ao buscar crimes:', crimesError);
          setError(crimesError.message);
          return;
        }

        // Agrupar dados por unidade para os totais
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

        // Calcular data inicial baseado no filtro de período
        const endDate = new Date();
        const startDate = new Date();
        const days = parseInt(timeRange.replace(/[^0-9]/g, ''));
        startDate.setDate(startDate.getDate() - days);

        // Criar um mapa de datas no intervalo
        const dateMap: Record<string, any> = {};
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          dateMap[dateStr] = {
            date: dateStr,
            'AISP 10': 0,
            'AISP 28': 0,
            'AISP 33': 0,
            'AISP 37': 0,
            'AISP 43': 0
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Agrupar dados por unidade e data (apenas para o período selecionado)
        crimes?.forEach((crime: any) => {
          const unit = crime.aisp;
          const date = crime.data_fato ? crime.data_fato.split('T')[0] : null;
          
          if (date && dateMap[date] && unit) {
            dateMap[date][unit] = (dateMap[date][unit] || 0) + 1;
          }
        });

        setData({
          units: { ...defaultUnits, ...unitData } || defaultUnits,
          timeseries: Object.values(dateMap)
        });
      } catch (err: any) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja zerar todos os dados? Esta ação não pode ser desfeita.')) {
      try {
        setLoading(true);
        const { error } = await getSupabaseAdmin()
          .from('crimes')
          .update({
            seq: null,
            seq_bo: null,
            ano_bo: null,
            data_fato: null,
            hora_fato: null,
            data_comunicacao: null,
            titulo_do_delito: null,
            tipo_do_delito: null,
            indicador_estrategico: null,
            fase_divulgacao: null,
            dia_semana: null,
            aisp: null,
            risp: null,
            municipio: null,
            bairro: null,
            faixa_horario: null
          })
          .neq('id', 0);

        if (error) throw error;

        // Recarregar dados
        await fetchData();
        
      } catch (err: any) {
        console.error('Erro ao limpar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

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
  const cpaTotal = Object.values(data.units).reduce((sum: number, unit: any) => sum + (unit?.total || 0), 0);
  const cpaTarget = calculateTarget('all');
  const cpaTrend = cpaTotal === 0 ? 0 : ((cpaTotal - cpaTarget) / cpaTarget) * 100;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            {/* CPA Total Card */}
            <div className="mb-8">
              <div className="bg-gray-800 text-white rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex-grow text-center">
                    <h3 className="text-2xl font-semibold">5ª RISP - Total de Ocorrências</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <ImportButton onImportSuccess={() => {
                      setLoading(true);
                      fetchData();
                    }} />
                    <button
                      onClick={handleClearData}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Limpar Dados
                    </button>
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
                <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto">
                  <div className="flex flex-col items-center">
                    <div className="bg-green-600 rounded-full p-4 mb-4">
                      <img 
                        src="/images/icons/letalidade.svg" 
                        alt="Letalidade Violenta"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Letalidade Violenta</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.lethal_violence || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['letalidade violenta'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.lethal_violence || 0), 0) - (targets['RISP 5']?.['letalidade violenta'] || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-green-600 rounded-full p-4 mb-4">
                      <img 
                        src="/images/icons/rouboveiculo.svg" 
                        alt="Roubo de Veículo"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Roubo de Veículo</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.vehicle_robbery || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de veículo'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.vehicle_robbery || 0), 0) - (targets['RISP 5']?.['roubo de veículo'] || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-green-600 rounded-full p-4 mb-4">
                      <img 
                        src="/images/icons/rouborua.svg" 
                        alt="Roubo de Rua"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Roubo de Rua</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.street_robbery || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de rua'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.street_robbery || 0), 0) - (targets['RISP 5']?.['roubo de rua'] || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-green-600 rounded-full p-4 mb-4">
                      <img 
                        src="/images/icons/roubocarga.svg" 
                        alt="Roubo de Carga"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Roubo de Carga</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.cargo_robbery || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de carga'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(data.units).reduce((sum, unit: any) => sum + (unit?.cargo_robbery || 0), 0) - (targets['RISP 5']?.['roubo de carga'] || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Battalion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              {Object.entries(data.units)
                .filter(([unit]) => unit !== 'null' && unit !== null)
                .map(([unit, stats]: [string, any]) => (
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
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Evolução por Batalhão</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período do Gráfico
                    </label>
                    <TimeRangeSelector
                      value={timeRange}
                      onChange={setTimeRange}
                    />
                  </div>
                </div>
              </div>
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
