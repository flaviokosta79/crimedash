import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { CrimeMap } from '../components/CrimeMap';
import type { CrimeData, CrimeType, PoliceUnit } from '../types';
import { supabase, supabaseAdmin } from '../lib/supabase';

// Define as cores para cada tipo de crime (usado em todos os gráficos)
const CRIME_COLORS = {
  'Letalidade Violenta': '#ff7f0e',
  'Roubo de Veículo': '#2ca02c',
  'Roubo de Rua': '#d62728',
  'Roubo de Carga': '#9467bd'
} as const;

// Define AISP areas with their coordinates
const UNIT_AREAS = {
  'AISP 10': [
    { city: 'Barra do Piraí', lat: -22.4714, lng: -43.8269 },
    { city: 'Valença', lat: -22.2445, lng: -43.7022 },
    { city: 'Rio das Flores', lat: -22.1692, lng: -43.5856 },
    { city: 'Piraí', lat: -22.6276, lng: -43.8982 },
    { city: 'Vassouras', lat: -22.4039, lng: -43.6634 },
    { city: 'Miguel Pereira', lat: -22.4572, lng: -43.4803 },
    { city: 'Paty do Alferes', lat: -22.4309, lng: -43.4285 },
    { city: 'Mendes', lat: -22.5245, lng: -43.7312 },
    { city: 'Engenheiro Paulo de Frontin', lat: -22.5498, lng: -43.6827 }
  ],
  'AISP 28': [
    { city: 'Volta Redonda', lat: -22.5202, lng: -44.0996 },
    { city: 'Barra Mansa', lat: -22.5446, lng: -44.1751 },
    { city: 'Pinheiral', lat: -22.5172, lng: -44.0022 }
  ],
  'AISP 33': [
    { city: 'Mangaratiba', lat: -22.9594, lng: -44.0409 },
    { city: 'Angra dos Reis', lat: -23.0067, lng: -44.3181 },
    { city: 'Rio Claro', lat: -22.7205, lng: -44.1419 }
  ],
  'AISP 37': [
    { city: 'Resende', lat: -22.4705, lng: -44.4509 },
    { city: 'Itatiaia', lat: -22.4897, lng: -44.5634 },
    { city: 'Porto Real', lat: -22.4175, lng: -44.2873 },
    { city: 'Quatis', lat: -22.4043, lng: -44.2597 }
  ],
  'AISP 43': [
    { city: 'Paraty', lat: -23.2178, lng: -44.7131 }
  ]
};

// Define o centro de cada AISP
const UNIT_CENTERS = {
  'AISP 10': { lat: -22.4039, lng: -43.6634 }, // Centralizado em Vassouras
  'AISP 28': { lat: -22.5202, lng: -44.0996 }, // Centralizado em Volta Redonda
  'AISP 33': { lat: -22.9594, lng: -44.0409 }, // Centralizado em Mangaratiba
  'AISP 37': { lat: -22.4705, lng: -44.4509 }, // Centralizado em Resende
  'AISP 43': { lat: -23.2178, lng: -44.7131 }  // Centralizado em Paraty
};

// Define o zoom ideal para cada AISP
const UNIT_ZOOM = {
  'AISP 10': 10, // Área maior, zoom mais distante
  'AISP 28': 11, // Área menor, zoom mais próximo
  'AISP 33': 10, // Área média
  'AISP 37': 10, // Área média
  'AISP 43': 11  // Área pequena, zoom mais próximo
};

// Define AISP colors
const UNIT_COLORS = {
  'AISP 10': '#1f77b4',
  'AISP 28': '#ff7f0e',
  'AISP 33': '#2ca02c',
  'AISP 37': '#d62728',
  'AISP 43': '#9467bd'
};

interface CrimeMetrics {
  name: string;
  atual: number;
  meta: number;
}

const generateCrimeMetrics = (unit: string, crimeData: any[]): CrimeMetrics[] => {
  // Extract crime data for the specified unit
  const crimeMetrics = [
    {
      name: 'Letalidade Violenta',
      atual: crimeData.filter((crime) => crime.indicador_estrategico?.toLowerCase() === 'letalidade violenta').length,
      meta: 75
    },
    {
      name: 'Roubo de Veículo',
      atual: crimeData.filter((crime) => crime.indicador_estrategico?.toLowerCase() === 'roubo de veículo').length,
      meta: 75
    },
    {
      name: 'Roubo de Rua',
      atual: crimeData.filter((crime) => crime.indicador_estrategico?.toLowerCase() === 'roubo de rua').length,
      meta: 75
    },
    {
      name: 'Roubo de Carga',
      atual: crimeData.filter((crime) => crime.indicador_estrategico?.toLowerCase() === 'roubo de carga').length,
      meta: 75
    }
  ];

  return crimeMetrics;
};

// Update the generateTimeSeriesData function to include card visualization data
const generateTimeSeriesData = (timeRange: string, unit: string, timeSeriesData: any[]) => {
  const data = [];
  const now = new Date();
  let periods;
  let dateFormat: Intl.DateTimeFormatOptions;

  switch(timeRange) {
    case 'D':
      periods = 24;
      dateFormat = { hour: '2-digit' };
      for (let i = 0; i < periods; i++) {
        const date = new Date(now);
        date.setHours(date.getHours() - (periods - i));
        data.push({
          date,
          occurrences: Math.floor(Math.random() * 50) + 50,
          target: 75
        });
      }
      break;
    
    case 'W':
      periods = 7;
      dateFormat = { weekday: 'short' };
      for (let i = 0; i < periods; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (periods - i));
        data.push({
          date,
          occurrences: Math.floor(Math.random() * 50) + 50,
          target: 75
        });
      }
      break;
    
    case 'M':
      periods = 30;
      dateFormat = { day: '2-digit', month: 'short' };
      for (let i = 0; i < periods; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (periods - i));
        data.push({
          date,
          occurrences: Math.floor(Math.random() * 50) + 50,
          target: 75
        });
      }
      break;
    
    case '6M':
      periods = 6;
      dateFormat = { month: 'short' };
      for (let i = 0; i < periods; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (periods - i));
        data.push({
          date,
          occurrences: Math.floor(Math.random() * 50) + 50,
          target: 75
        });
      }
      break;
    
    case 'Y':
      periods = 12;
      dateFormat = { month: 'short' };
      for (let i = 0; i < periods; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (periods - i));
        data.push({
          date,
          occurrences: Math.floor(Math.random() * 50) + 50,
          target: 75
        });
      }
      break;
  }

  const cardData = {
    total: data.reduce((sum, item) => sum + item.occurrences, 0),
    average: Math.round(data.reduce((sum, item) => sum + item.occurrences, 0) / data.length),
    max: Math.max(...data.map(item => item.occurrences)),
    min: Math.min(...data.map(item => item.occurrences)),
    trend: ((data[data.length - 1].occurrences - data[0].occurrences) / data[0].occurrences * 100).toFixed(1)
  };

  return { data, dateFormat, cardData };
};

const generateHeatMapData = (unit: string, crimes: any[]) => {
  // Mapeamento de nomes de municípios (incluindo variações)
  const cityMapping: Record<string, string> = {
    'rio das flores': 'Rio das Flores',
    'rio-das-flores': 'Rio das Flores',
    'riodasflores': 'Rio das Flores',
    'barra do pirai': 'Barra do Piraí',
    'barra-do-pirai': 'Barra do Piraí',
    'barradopirai': 'Barra do Piraí',
    'valenca': 'Valença',
    'valença': 'Valença',
    'pirai': 'Piraí',
    'piraí': 'Piraí',
    'vassouras': 'Vassouras',
    'miguel pereira': 'Miguel Pereira',
    'miguel-pereira': 'Miguel Pereira',
    'miguelpereira': 'Miguel Pereira',
    'paty do alferes': 'Paty do Alferes',
    'paty-do-alferes': 'Paty do Alferes',
    'patydoalferes': 'Paty do Alferes',
    'mendes': 'Mendes',
    'engenheiro paulo de frontin': 'Engenheiro Paulo de Frontin',
    'eng paulo de frontin': 'Engenheiro Paulo de Frontin',
    'eng. paulo de frontin': 'Engenheiro Paulo de Frontin',
    'volta redonda': 'Volta Redonda',
    'volta-redonda': 'Volta Redonda',
    'voltaredonda': 'Volta Redonda',
    'barra mansa': 'Barra Mansa',
    'barra-mansa': 'Barra Mansa',
    'barramansa': 'Barra Mansa',
    'pinheiral': 'Pinheiral',
    'mangaratiba': 'Mangaratiba',
    'angra dos reis': 'Angra dos Reis',
    'angra-dos-reis': 'Angra dos Reis',
    'angradosreis': 'Angra dos Reis',
    'rio claro': 'Rio Claro',
    'rio-claro': 'Rio Claro',
    'rioclaro': 'Rio Claro',
    'resende': 'Resende',
    'itatiaia': 'Itatiaia',
    'porto real': 'Porto Real',
    'porto-real': 'Porto Real',
    'portoreal': 'Porto Real',
    'quatis': 'Quatis',
    'paraty': 'Paraty',
    'parati': 'Paraty'
  };

  const unitArea = UNIT_AREAS[unit as keyof typeof UNIT_AREAS] || [];
  const crimesByCityAndNeighborhood: Record<string, Record<string, { count: number, bairros: Set<string> }>> = {};
  
  // Inicializar contadores para cada cidade
  unitArea.forEach(location => {
    crimesByCityAndNeighborhood[location.city] = {
      'Letalidade Violenta': { count: 0, bairros: new Set() },
      'Roubo de Veículo': { count: 0, bairros: new Set() },
      'Roubo de Rua': { count: 0, bairros: new Set() },
      'Roubo de Carga': { count: 0, bairros: new Set() }
    };
  });

  // Contar crimes por cidade e tipo
  crimes.forEach(crime => {
    const municipioLower = crime.municipio?.toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ');

    const tipo = crime.indicador_estrategico?.toLowerCase() || '';
    const bairro = crime.bairro || 'Não informado';
    
    const cidadeMapeada = cityMapping[municipioLower];
    const cityMatch = unitArea.find(location => 
      location.city === cidadeMapeada
    );

    if (cityMatch) {
      switch (tipo) {
        case 'letalidade violenta':
          crimesByCityAndNeighborhood[cityMatch.city]['Letalidade Violenta'].count++;
          crimesByCityAndNeighborhood[cityMatch.city]['Letalidade Violenta'].bairros.add(bairro);
          break;
        case 'roubo de rua':
          crimesByCityAndNeighborhood[cityMatch.city]['Roubo de Rua'].count++;
          crimesByCityAndNeighborhood[cityMatch.city]['Roubo de Rua'].bairros.add(bairro);
          break;
        case 'roubo de veículo':
          crimesByCityAndNeighborhood[cityMatch.city]['Roubo de Veículo'].count++;
          crimesByCityAndNeighborhood[cityMatch.city]['Roubo de Veículo'].bairros.add(bairro);
          break;
        case 'roubo de carga':
          crimesByCityAndNeighborhood[cityMatch.city]['Roubo de Carga'].count++;
          crimesByCityAndNeighborhood[cityMatch.city]['Roubo de Carga'].bairros.add(bairro);
          break;
      }
    }
  });

  // Gerar dados do mapa de calor
  const heatMapData = unitArea.flatMap(location => {
    const cityData = crimesByCityAndNeighborhood[location.city];
    return Object.entries(cityData)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        id: `${location.city}-${type}`,
        date: new Date(),
        type: type as CrimeType,
        unit: unit as PoliceUnit,
        count: data.count,
        lat: location.lat,
        lng: location.lng,
        region: location.city,
        bairros: Array.from(data.bairros).sort()
      }));
  });

  return heatMapData;
};

export const UnitDashboard: React.FC = () => {
  const { unit } = useParams<{ unit: string }>();
  const [loading, setLoading] = useState(true);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('M');
  const [mapData, setMapData] = useState<CrimeData[]>([]);
  const [unitData, setUnitData] = useState({
    total: 0,
    lethal_violence: 0,
    street_robbery: 0,
    vehicle_robbery: 0,
    cargo_robbery: 0
  });
  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});
  const [cardData, setCardData] = useState({
    letalidadeViolenta: 0,
    rouboDeVeiculo: 0,
    rouboDeRua: 0,
    rouboDeCarga: 0
  });

  useEffect(() => {
    const fetchTargets = async () => {
      const { data: targetsData, error } = await supabaseAdmin
        .from('targets')
        .select('*')
        .eq('unit', unit)
        .eq('year', new Date().getFullYear())
        .eq('semester', new Date().getMonth() < 6 ? 1 : 2);

      if (error) {
        console.error('Erro ao buscar metas:', error);
        return;
      }

      const targetMap: Record<string, Record<string, number>> = {};
      if (!targetMap[unit as string]) {
        targetMap[unit as string] = {};
      }

      targetsData?.forEach((target) => {
        targetMap[unit as string][target.crime_type.toLowerCase()] = target.target_value;
      });

      setTargets(targetMap);
    };

    if (unit) {
      fetchTargets();
    }
  }, [unit]);

  useEffect(() => {
    if (unit) {
      loadData();
    }
  }, [unit]);

  const loadData = async () => {
    if (!unit) return;
    setLoading(true);

    try {
      // Buscar todos os crimes da unidade sem filtro de data
      const { data: crimes, error } = await supabaseAdmin
        .from('crimes')
        .select('*')
        .eq('aisp', unit);

      if (error) {
        setError('Erro ao buscar crimes: ' + error.message);
        return;
      }

      // Inicializa contadores
      const newCardData = {
        letalidadeViolenta: 0,
        rouboDeVeiculo: 0,
        rouboDeRua: 0,
        rouboDeCarga: 0
      };

      // Conta os crimes usando a mesma lógica do Dashboard
      crimes?.forEach((crime: any) => {
        const indicator = crime.indicador_estrategico?.toLowerCase() || '';
        
        // Incrementar contadores específicos usando includes como no Dashboard
        if (indicator.includes('letalidade')) {
          newCardData.letalidadeViolenta += 1;
        }
        if (indicator.includes('roubo de rua')) {
          newCardData.rouboDeRua += 1;
        }
        if (indicator.includes('roubo de veículo')) {
          newCardData.rouboDeVeiculo += 1;
        }
        if (indicator.includes('roubo de carga')) {
          newCardData.rouboDeCarga += 1;
        }
      });

      setCardData(newCardData);
      setCrimes(crimes || []);
      const mapDataGenerated = generateHeatMapData(unit, crimes || []);
      setMapData(mapDataGenerated);
    } catch (error: any) {
      setError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
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

  // Agrupar crimes por tipo para o gráfico de pizza
  const crimesByType = crimes.reduce((acc: Record<string, number>, crime) => {
    const type = crime.indicador_estrategico?.toLowerCase() || 'outros';
    // Mapeia os tipos para o formato exato das chaves do CRIME_COLORS
    let formattedType = type;
    switch (type) {
      case 'letalidade violenta':
        formattedType = 'Letalidade Violenta';
        break;
      case 'roubo de veículo':
        formattedType = 'Roubo de Veículo';
        break;
      case 'roubo de rua':
        formattedType = 'Roubo de Rua';
        break;
      case 'roubo de carga':
        formattedType = 'Roubo de Carga';
        break;
    }
    acc[formattedType] = (acc[formattedType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(crimesByType)
    .map(([type, value]) => ({
      name: type,
      value
    }))
    .sort((a, b) => b.value - a.value);

  // Ordenar crimes por município e data
  const sortedCrimes = [...crimes].sort((a, b) => {
    // Primeiro ordena por município
    const compareCity = a.municipio.localeCompare(b.municipio);
    if (compareCity !== 0) return compareCity;
    
    // Se o município for igual, ordena por data (mais recente primeiro)
    return new Date(b.data_fato).getTime() - new Date(a.data_fato).getTime();
  });

  // Dados para o gráfico de barras de comparação
  const crimeMetrics = [
    {
      name: 'Letalidade Violenta',
      atual: cardData.letalidadeViolenta,
      meta: targets[unit as string]?.['letalidade violenta'] || 0
    },
    {
      name: 'Roubo de Veículo',
      atual: cardData.rouboDeVeiculo,
      meta: targets[unit as string]?.['roubo de veículo'] || 0
    },
    {
      name: 'Roubo de Rua',
      atual: cardData.rouboDeRua,
      meta: targets[unit as string]?.['roubo de rua'] || 0
    },
    {
      name: 'Roubo de Carga',
      atual: cardData.rouboDeCarga,
      meta: targets[unit as string]?.['roubo de carga'] || 0
    }
  ];

  const { data: timeSeriesData, cardData: timeSeriesCardData } = generateTimeSeriesData(timeRange, unit || '', []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{unit}</h1>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div 
                className="p-6 rounded-lg shadow-lg h-48"
                style={{ 
                  backgroundColor: CRIME_COLORS['Letalidade Violenta'] + '15',
                  borderLeft: `4px solid ${CRIME_COLORS['Letalidade Violenta']}`
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Letalidade Violenta</h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Atual</p>
                    <p className="text-3xl font-bold" style={{ color: CRIME_COLORS['Letalidade Violenta'] }}>
                      {cardData.letalidadeViolenta}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-600">Meta</p>
                      <p className="text-lg font-semibold text-gray-700">{targets[unit as string]?.['letalidade violenta'] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Diferença</p>
                      {(() => {
                        const diff = cardData.letalidadeViolenta - (targets[unit as string]?.['letalidade violenta'] || 0);
                        const colorClass = diff <= 0 ? 'text-green-600' : 'text-red-600';
                        const sign = diff <= 0 ? '' : '+';
                        return (
                          <p className={`text-lg font-semibold ${colorClass}`}>
                            {sign}{diff}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-lg shadow-lg h-48"
                style={{ 
                  backgroundColor: CRIME_COLORS['Roubo de Veículo'] + '15',
                  borderLeft: `4px solid ${CRIME_COLORS['Roubo de Veículo']}`
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Roubo de Veículo</h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Atual</p>
                    <p className="text-3xl font-bold" style={{ color: CRIME_COLORS['Roubo de Veículo'] }}>
                      {cardData.rouboDeVeiculo}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-600">Meta</p>
                      <p className="text-lg font-semibold text-gray-700">{targets[unit as string]?.['roubo de veículo'] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Diferença</p>
                      {(() => {
                        const diff = cardData.rouboDeVeiculo - (targets[unit as string]?.['roubo de veículo'] || 0);
                        const colorClass = diff <= 0 ? 'text-green-600' : 'text-red-600';
                        const sign = diff <= 0 ? '' : '+';
                        return (
                          <p className={`text-lg font-semibold ${colorClass}`}>
                            {sign}{diff}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-lg shadow-lg h-48"
                style={{ 
                  backgroundColor: CRIME_COLORS['Roubo de Rua'] + '15',
                  borderLeft: `4px solid ${CRIME_COLORS['Roubo de Rua']}`
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Roubo de Rua</h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Atual</p>
                    <p className="text-3xl font-bold" style={{ color: CRIME_COLORS['Roubo de Rua'] }}>
                      {cardData.rouboDeRua}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-600">Meta</p>
                      <p className="text-lg font-semibold text-gray-700">{targets[unit as string]?.['roubo de rua'] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Diferença</p>
                      {(() => {
                        const diff = cardData.rouboDeRua - (targets[unit as string]?.['roubo de rua'] || 0);
                        const colorClass = diff <= 0 ? 'text-green-600' : 'text-red-600';
                        const sign = diff <= 0 ? '' : '+';
                        return (
                          <p className={`text-lg font-semibold ${colorClass}`}>
                            {sign}{diff}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-lg shadow-lg h-48"
                style={{ 
                  backgroundColor: CRIME_COLORS['Roubo de Carga'] + '15',
                  borderLeft: `4px solid ${CRIME_COLORS['Roubo de Carga']}`
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Roubo de Carga</h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Atual</p>
                    <p className="text-3xl font-bold" style={{ color: CRIME_COLORS['Roubo de Carga'] }}>
                      {cardData.rouboDeCarga}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-600">Meta</p>
                      <p className="text-lg font-semibold text-gray-700">{targets[unit as string]?.['roubo de carga'] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Diferença</p>
                      {(() => {
                        const diff = cardData.rouboDeCarga - (targets[unit as string]?.['roubo de carga'] || 0);
                        const colorClass = diff <= 0 ? 'text-green-600' : 'text-red-600';
                        const sign = diff <= 0 ? '' : '+';
                        return (
                          <p className={`text-lg font-semibold ${colorClass}`}>
                            {sign}{diff}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Distribuição */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Distribuição de Crimes</h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((entry) => (
                          <Cell 
                            key={`cell-${entry.name}`}
                            fill={CRIME_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparação */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Comparação com Meta</h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crimeMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="atual" name="Atual">
                        {crimeMetrics.map((entry) => (
                          <Cell 
                            key={`cell-${entry.name}`}
                            fill={CRIME_COLORS[entry.name]}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="meta" name="Meta" fill="#9333ea" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Mapa de Calor */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-lg font-semibold mb-4">Mapa de Calor</h2>
              <div className="h-[500px]">
                <CrimeMap 
                  data={mapData}
                  center={unit ? UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS] : undefined}
                  zoom={unit ? UNIT_ZOOM[unit as keyof typeof UNIT_ZOOM] : undefined}
                />
              </div>
            </div>

            {/* Lista de Ocorrências */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Últimas Ocorrências</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Município
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bairro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCrimes.map((crime) => (
                      <tr key={crime.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(crime.data_fato).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {crime.indicador_estrategico?.toLowerCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {crime.municipio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {crime.bairro}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};