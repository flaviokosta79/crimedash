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
import { supabase, getSupabaseAdmin } from '../config/supabase';
import { FiUpload, FiTrash2, FiSettings, FiLogOut, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { crimeService } from '../services/crimeService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const battalionColors: Record<PoliceUnit, string> = {
    'AISP 10': 'bg-blue-600',
    'AISP 28': 'bg-orange-600',
    'AISP 33': 'bg-green-600',
    'AISP 37': 'bg-red-600',
    'AISP 43': 'bg-purple-600'
  };

  const graphColors: Record<PoliceUnit, string> = {
    'AISP 10': '#1f77b4',
    'AISP 28': '#ff7f0e',
    'AISP 33': '#2ca02c',
    'AISP 37': '#d62728',
    'AISP 43': '#9467bd'
  };

  const textColors: Record<PoliceUnit, string> = {
    'AISP 10': 'text-blue-600',
    'AISP 28': 'text-orange-600',
    'AISP 33': 'text-green-600',
    'AISP 37': 'text-red-600',
    'AISP 43': 'text-purple-600'
  };

  const defaultUnits = {
    'AISP 10': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 28': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 33': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 37': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 },
    'AISP 43': { total: 0, letalidadeViolenta: 0, rouboDeRua: 0, rouboDeVeiculo: 0, rouboDeCarga: 0 }
  };

  const fetchGraphData = async () => {
    try {
      setError(null);
      
      const { data: allCrimes, error } = await getSupabaseAdmin()
        .from('crimes2')
        .select('*')
        .eq('RISP do fato', 'RISP 5'); // Filtrando apenas crimes da RISP 5

      if (error) throw error;

      const processedData = processGraphData(allCrimes, timeRange);
      setGraphData(processedData);
    } catch (error: any) {
      console.error('Erro ao buscar dados do gráfico:', error);
      setError(error.message);
    }
  };

  const processTargets = (data: any[]) => {
    const targetsByUnit: Record<string, Record<string, number>> = {};
    
    // Função para normalizar os tipos de crime
    const normalizeCrimeType = (type: string) => {
      const normalized = type.toLowerCase();
      switch (normalized) {
        case 'letalidade violenta':
          return 'Letalidade Violenta';
        case 'roubo de rua':
          return 'Roubo de Rua';
        case 'roubo de veículo':
          return 'Roubo de Veículo';
        case 'roubo de carga':
          return 'Roubo de Carga';
        default:
          return type;
      }
    };
    
    data.forEach((target: any) => {
      if (!targetsByUnit[target.unit]) {
        targetsByUnit[target.unit] = {};
      }
      const normalizedType = normalizeCrimeType(target.crime_type);
      targetsByUnit[target.unit][normalizedType] = target.target_value;
    });
    
    return targetsByUnit;
  };

  const fetchCardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [crimesResponse, targetsResponse] = await Promise.all([
        getSupabaseAdmin()
          .from('crimes2')
          .select('*')
          .eq('RISP do fato', 'RISP 5')
          .in('Indicador estrategico', ['letalidade violenta', 'roubo de rua', 'roubo de veículo', 'roubo de carga']),
        getSupabaseAdmin()
          .from('targets')
          .select('*')
          .eq('year', new Date().getFullYear())
          .eq('semester', new Date().getMonth() < 6 ? 1 : 2)
      ]);

      if (crimesResponse.error) throw crimesResponse.error;
      if (targetsResponse.error) throw targetsResponse.error;

      console.log('Total de registros da RISP 5:', crimesResponse.data.length);
      
      const processedData = processCardData(crimesResponse.data);
      console.log('Dados processados:', processedData);
      
      setCardData(processedData);
      
      const processedTargets = processTargets(targetsResponse.data);
      setTargets(processedTargets);
    } catch (error: any) {
      console.error('Erro ao buscar dados dos cards:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processGraphData = (data: any[], timeRange: TimeRange) => {
    // Criar um mapa de datas com todos os dias no período
    const dateMap: { [key: string]: any } = {};
    const startDate = new Date();
    const endDate = new Date();

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

    // Inicializar todos os dias no período com valores zerados
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

    // Filtrar apenas crimes com indicador estratégico válido
    const validCrimes = data.filter(crime => {
      const indicator = crime['Indicador estrategico']?.toLowerCase();
      return (
        indicator === 'letalidade violenta' ||
        indicator === 'roubo de rua' ||
        indicator === 'roubo de veículo' ||
        indicator === 'roubo de carga'
      );
    });

    // Preencher com os dados reais de crimes
    validCrimes.forEach((crime) => {
      const dia = String(crime['Dia do registro']).padStart(2, '0');
      const mes = String(crime['Mes do registro']).padStart(2, '0');
      const ano = crime['Ano do registro'];
      const date = `${ano}-${mes}-${dia}`;
      if (dateMap[date] && crime['AISP do fato']) {
        dateMap[date][crime['AISP do fato']] = (dateMap[date][crime['AISP do fato']] || 0) + 1;
      }
    });

    // Retornar array ordenado por data
    return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processCardData = (data: any[]) => {
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
    data.forEach((crime: any) => {
      const unit = crime['AISP do fato'];
      const indicator = crime['Indicador estrategico']?.toLowerCase();
      
      if (unit && unitTotals[unit]) {
        // Incrementar apenas baseado no indicador estratégico
        switch (indicator) {
          case 'letalidade violenta':
            unitTotals[unit].letalidadeViolenta += 1;
            break;
          case 'roubo de rua':
            unitTotals[unit].rouboDeRua += 1;
            break;
          case 'roubo de veículo':
            unitTotals[unit].rouboDeVeiculo += 1;
            break;
          case 'roubo de carga':
            unitTotals[unit].rouboDeCarga += 1;
            break;
        }
        // Calcular o total após o switch
        unitTotals[unit].total = 
          unitTotals[unit].letalidadeViolenta +
          unitTotals[unit].rouboDeRua +
          unitTotals[unit].rouboDeVeiculo +
          unitTotals[unit].rouboDeCarga;
      }
    });

    // Adicionar totais da RISP 5
    unitTotals['RISP 5'] = {
      total: Object.values(unitTotals).reduce((sum: number, unit: any) => sum + unit.total, 0),
      letalidadeViolenta: Object.values(unitTotals).reduce((sum: number, unit: any) => sum + unit.letalidadeViolenta, 0),
      rouboDeRua: Object.values(unitTotals).reduce((sum: number, unit: any) => sum + unit.rouboDeRua, 0),
      rouboDeVeiculo: Object.values(unitTotals).reduce((sum: number, unit: any) => sum + unit.rouboDeVeiculo, 0),
      rouboDeCarga: Object.values(unitTotals).reduce((sum: number, unit: any) => sum + unit.rouboDeCarga, 0)
    };

    return unitTotals;
  };

  const handleImportSuccess = () => {
    fetchCardData();
  };

  const fetchTargets = async () => {
    try {
      const { data: targetsData, error } = await supabaseAdmin
        .from('targets')
        .select('*')
        .eq('year', new Date().getFullYear())
        .eq('semester', new Date().getMonth() < 6 ? 1 : 2);

      if (error) {
        setError('Erro ao buscar metas: ' + error.message);
        return;
      }

      const targetsByUnit: Record<string, Record<string, number>> = {};

      targetsData?.forEach((target) => {
        if (!targetsByUnit[target.unit]) {
          targetsByUnit[target.unit] = {};
        }
        targetsByUnit[target.unit][target.crime_type.toLowerCase()] = target.target_value;
      });

      setTargets(targetsByUnit);
    } catch (err: any) {
      toast.error('Erro ao carregar metas: ' + err.message);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      try {
        const { error: deleteError } = await getSupabaseAdmin()
          .from('crimes2')
          .delete()
          .neq('objectid', '0'); // usando neq para garantir que a query afete todas as linhas

        if (deleteError) throw deleteError;

        await fetchCardData();
        await fetchGraphData();
        toast.success('Dados limpos com sucesso!');
      } catch (error: any) {
        toast.error(`Erro ao limpar dados: ${error.message}`);
      }
    }
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    const scrollPosition = window.scrollY;
    setTimeRange(newRange);
    window.scrollTo(0, scrollPosition);
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
    const loadData = async () => {
      await fetchCardData();
      await fetchGraphData();
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [timeRange]);

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
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <FiUsers size={16} />
                          Usuários
                        </button>
                        <button
                          onClick={() => navigate('/targets')}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        >
                          <FiSettings size={16} />
                          Metas
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          <FiUpload size={16} />
                          Importar Dados
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                toast.loading('Importando dados...', { id: 'import' });
                                await crimeService.importXLSX(file);
                                await fetchCardData();
                                await fetchGraphData();
                                toast.success('Dados importados com sucesso!', { id: 'import' });
                              } catch (error: any) {
                                console.error('Erro ao importar arquivo:', error);
                                toast.error(`Erro ao importar arquivo: ${error.message}`, { id: 'import' });
                              } finally {
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={handleClearData}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <FiTrash2 size={16} />
                          Limpar Dados
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <FiLogOut size={16} />
                      Sair
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto">
                  <div className="flex flex-col items-center">
                    <div className={`${
                      Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.letalidadeViolenta || 0), 0) > (targets['RISP 5']?.['letalidade violenta'] || 0) 
                      ? 'bg-red-600' 
                      : 'bg-green-600'
                    } rounded-full p-4 mb-4`}>
                      <img 
                        src="/images/icons/letalidade.svg" 
                        alt="Letalidade Violenta"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Letalidade Violenta</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.letalidadeViolenta || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['letalidade violenta'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.letalidadeViolenta || 0), 0) - (targets['RISP 5']?.['letalidade violenta'] || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`${
                      Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeVeiculo || 0), 0) > (targets['RISP 5']?.['roubo de veículo'] || 0)
                      ? 'bg-red-600' 
                      : 'bg-green-600'
                    } rounded-full p-4 mb-4`}>
                      <img 
                        src="/images/icons/rouboveiculo.svg" 
                        alt="Roubo de Veículo"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Roubo de Veículo</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeVeiculo || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de veículo'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeVeiculo || 0), 0) - (targets['RISP 5']?.['roubo de veículo'] || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`${
                      Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeRua || 0), 0) > (targets['RISP 5']?.['roubo de rua'] || 0)
                      ? 'bg-red-600' 
                      : 'bg-green-600'
                    } rounded-full p-4 mb-4`}>
                      <img 
                        src="/images/icons/rouborua.svg" 
                        alt="Roubo de Rua"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Roubo de Rua</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeRua || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de rua'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeRua || 0), 0) - (targets['RISP 5']?.['roubo de rua'] || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`${
                      Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeCarga || 0), 0) > (targets['RISP 5']?.['roubo de carga'] || 0)
                      ? 'bg-red-600' 
                      : 'bg-green-600'
                    } rounded-full p-4 mb-4`}>
                      <img 
                        src="/images/icons/roubocarga.svg" 
                        alt="Roubo de Carga"
                        className="w-12 h-12"
                      />
                    </div>
                    <span className="text-sm uppercase mb-2">Roubo de Carga</span>
                    <span className="text-3xl font-bold mb-2">
                      {Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeCarga || 0), 0)}
                    </span>
                    <span className="text-sm">
                      Meta: {targets['RISP 5']?.['roubo de carga'] || 0}
                    </span>
                    <span className="text-sm text-gray-400">
                      Diferença: {(Object.entries(cardData)
                        .filter(([unit]) => unit.startsWith('AISP'))
                        .reduce((sum, [_, unit]: [string, any]) => sum + (unit?.rouboDeCarga || 0), 0) - (targets['RISP 5']?.['roubo de carga'] || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Battalion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              {Object.entries(cardData)
                .filter(([unit]) => unit.startsWith('AISP'))
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
                    onChange={handleTimeRangeChange}
                  />
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer key="crime-chart" width="100%" height="100%">
                  <LineChart
                    ref={chartRef}
                    data={graphData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const [year, month, day] = date.split('-');
                        return `${day}/${month}`;
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const date = new Date(label);
                          date.setHours(date.getHours() + 3);
                          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                          return (
                            <div className="bg-white p-4 border border-gray-200 rounded shadow-lg min-w-[200px]">
                              <div className="text-base font-bold text-gray-700 mb-2">{formattedDate}</div>
                              {payload.map((pld, index) => {
                                const textColor = textColors[pld.name as PoliceUnit] || 'text-gray-600';
                                return (
                                  <div key={index} className="text-base mb-1 flex justify-between">
                                    <span className={`font-medium ${textColor}`}>{pld.name}</span>
                                    <span className="text-gray-600">{pld.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {Object.keys(graphColors).map((battalion) => (
                      <Line
                        key={battalion}
                        type="monotone"
                        dataKey={battalion}
                        name={battalion}
                        stroke={graphColors[battalion as PoliceUnit]}
                        activeDot={{ r: 8 }}
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
      <p className="mt-4 text-center text-sm text-gray-600">
        Feito por Flavio Costa
      </p>
    </div>
  );
};

