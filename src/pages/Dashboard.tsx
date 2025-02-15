import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ImportButton } from '../components/ImportButton';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { PoliceUnit } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { FiUpload, FiTrash2, FiSettings, FiLogOut, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface DashboardData {
  units: Record<string, {
    total: number;
    letalidadeViolenta: number;
    rouboDeRua: number;
    rouboDeVeiculo: number;
    rouboDeCarga: number;
  }>;
  timeseries: Array<{
    date: string;
    unit: string;
    count: number;
  }>;
}

type TimeRange = '7D' | '30D' | '90D';

export const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<Record<string, any>>({});
  const [graphData, setGraphData] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);

  const battalionColors: Record<PoliceUnit, string> = {
    'AISP 10': 'bg-blue-600',
    'AISP 28': 'bg-orange-600',
    'AISP 33': 'bg-green-600',
    'AISP 37': 'bg-red-600',
    'AISP 43': 'bg-purple-600'
  };

  const defaultUnits = {
    'AISP 10': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 28': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 33': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 37': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 43': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 }
  };

  const fetchCardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: allCrimes, error } = await supabaseAdmin
        .from('crimes')
        .select('*');

      if (error) throw error;

      // Inicializar contadores por unidade
      const unitTotals: Record<string, any> = {};
      ['AISP 10', 'AISP 28', 'AISP 33', 'AISP 37', 'AISP 43'].forEach(unit => {
        unitTotals[unit] = {
          total: 0,
          letalidadeViolenta: 0,
          rouboDeRua: 0,
          rouboDeVeiculo: 0,
          rouboDeCarga: 0
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
            unitTotals[unit].letalidadeViolenta += 1;
          }
          if (indicator.includes('roubo de rua')) {
            unitTotals[unit].rouboDeRua += 1;
          }
          if (indicator.includes('roubo de veículo')) {
            unitTotals[unit].rouboDeVeiculo += 1;
          }
          if (indicator.includes('roubo de carga')) {
            unitTotals[unit].rouboDeCarga += 1;
          }
        }
      });

      setCardData(unitTotals);

      // Buscar metas
      const { data: targetsData, error: targetsError } = await supabase
        .from('targets')
        .select('*')
        .eq('year', 2025)
        .eq('semester', 1)
        .in('unit', ['RISP 5', 'AISP 10', 'AISP 28', 'AISP 33', 'AISP 37', 'AISP 43']); // Buscando metas de todas as unidades

      if (targetsError) throw targetsError;

      console.log('Metas recebidas:', targetsData); // Para debug

      // Processar metas por unidade
      const targetsByUnit: Record<string, Record<string, number>> = {};
      targetsData?.forEach((target) => {
        if (!targetsByUnit[target.unit]) {
          targetsByUnit[target.unit] = {};
        }
        targetsByUnit[target.unit][target.crime_type] = target.target_value;
      });

      console.log('Metas processadas:', targetsByUnit); // Para debug

      setTargets(targetsByUnit);
    } catch (err: any) {
      console.error('Error fetching card data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphData = async () => {
    try {
      setError(null);

      // Calcular datas baseado no timeRange
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7D':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30D':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90D':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const { data: crimes, error } = await supabaseAdmin
        .from('crimes')
        .select('*')
        .gte('data_fato', startDate.toISOString().split('T')[0])
        .lte('data_fato', endDate.toISOString().split('T')[0])
        .order('data_fato', { ascending: true });

      if (error) throw error;

      // Processar dados para o gráfico
      const processedData = processGraphData(crimes || []);
      setGraphData(processedData);
    } catch (err: any) {
      console.error('Error fetching graph data:', err);
      setError(err.message);
    }
  };

  const processGraphData = (crimes: any[]) => {
    // Criar mapa de datas para o gráfico
    const dateMap: Record<string, any> = {};
    const currentDate = new Date();
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7D':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30D':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90D':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    while (currentDate >= startDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        'AISP 10': 0,
        'AISP 28': 0,
        'AISP 33': 0,
        'AISP 37': 0,
        'AISP 43': 0
      };
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Processar crimes do período para o gráfico
    crimes?.forEach((crime: any) => {
      const date = crime.data_fato?.split('T')[0];
      const unit = crime.aisp;
      if (date && unit && dateMap[date]) {
        dateMap[date][unit] = (dateMap[date][unit] || 0) + 1;
      }
    });

    return Object.values(dateMap);
  };

  const handleImportSuccess = () => {
    fetchCardData();
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userRole = session?.user?.user_metadata?.role;
      setIsAdmin(userRole === 'admin');
    };
    
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchCardData();
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [timeRange]);

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja zerar todos os dados? Esta ação não pode ser desfeita.')) {
      try {
        setLoading(true);
        const { error } = await supabaseAdmin
          .from('crimes')
          .delete()
          .neq('id', 0);

        if (error) throw error;

        // Recarregar dados
        await fetchCardData();
        await fetchGraphData();
        
      } catch (err: any) {
        console.error('Erro ao limpar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao fazer logout: ${error.message}`);
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
  const cpaTotal = Object.values(cardData).reduce((sum: number, unit: any) => sum + (unit?.total || 0), 0);
  const cpaTarget = (
    (targets['RISP 5']?.['letalidade violenta'] || 0) + 
    (targets['RISP 5']?.['roubo de veículo'] || 0) + 
    (targets['RISP 5']?.['roubo de rua'] || 0) + 
    (targets['RISP 5']?.['roubo de carga'] || 0)
  );
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
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => navigate('/users')}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FiUsers className="mr-2 h-5 w-5" />
                          Gerenciar Usuários
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FiUpload className="mr-2 h-5 w-5" />
                          Importar Dados
                        </button>
                        <button
                          onClick={handleClearData}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FiTrash2 className="mr-2 h-5 w-5" />
                          Limpar Dados
                        </button>
                        <Link
                          to="/targets"
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <FiSettings className="mr-2 h-5 w-5" />
                          Metas
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiLogOut className="mr-2 h-5 w-5" />
                      Sair
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
                      {Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.letalidadeViolenta || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['letalidade violenta'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.letalidadeViolenta || 0), 0) - (targets['RISP 5']?.['letalidade violenta'] || 0))}
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
                      {Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.rouboDeVeiculo || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de veículo'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.rouboDeVeiculo || 0), 0) - (targets['RISP 5']?.['roubo de veículo'] || 0))}
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
                      {Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.rouboDeRua || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de rua'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.rouboDeRua || 0), 0) - (targets['RISP 5']?.['roubo de rua'] || 0))}
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
                      {Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.rouboDeCarga || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de carga'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.values(cardData).reduce((sum, unit: any) => sum + (unit?.rouboDeCarga || 0), 0) - (targets['RISP 5']?.['roubo de carga'] || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Battalion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              {Object.entries(cardData)
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
                        <p className="text-sm">Letalidade Violenta</p>
                        <p className="text-lg font-bold">
                          {stats.letalidadeViolenta}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['letalidade violenta'] || 0}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Roubo de Veículo</p>
                        <p className="text-lg font-bold">
                          {stats.rouboDeVeiculo}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['roubo de veículo'] || 0}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Roubo de Rua</p>
                        <p className="text-lg font-bold">
                          {stats.rouboDeRua}
                          <span className="text-sm font-normal ml-2">
                            Meta: {targets[unit]?.['roubo de rua'] || 0}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Roubo de Carga</p>
                        <p className="text-lg font-bold">
                          {stats.rouboDeCarga}
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
            <div ref={chartRef} className="bg-white p-6 rounded-lg shadow-lg relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Gráfico de Ocorrências</h2>
                <div className="flex items-center gap-4">
                  <TimeRangeSelector
                    timeRange={timeRange}
                    onChange={(range) => setTimeRange(range as TimeRange)}
                  />
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
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
