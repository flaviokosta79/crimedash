import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { CrimeMap } from '../components/CrimeMap';
import type { CrimeType, PoliceUnit, PoliceRegion } from '../types';
import { supabase as supabaseAdmin } from '../config/supabase';
import { getTableName } from '../config/supabase';

// Update LocalCrimeData interface to exactly match CrimeData interface from types.ts
interface LocalCrimeData {
  id: string;
  date: string;
  type: CrimeType;
  unit: PoliceUnit;
  region: PoliceRegion;  // Changed from string to PoliceRegion
  count: number;
  target: number;
  lat: number;
  lng: number;
}

const CRIME_COLORS: Record<string, string> = {
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

// Update the generateHeatMapData function to match the interface
const generateHeatMapData = (unit: string, crimes: any[]): LocalCrimeData[] => {
  // Verificar se há crimes válidos
  if (!crimes || crimes.length === 0) {
    console.log('Sem crimes para gerar mapa de calor');
    return [];
  }

  console.log(`Gerando mapa de calor para ${unit} com ${crimes.length} crimes`);
  
  const unitArea = UNIT_AREAS[unit as keyof typeof UNIT_AREAS] || [];
  
  // Verificar se a unidade tem áreas definidas
  if (unitArea.length === 0) {
    console.log(`Nenhuma área definida para a unidade ${unit}`);
    return [];
  }
  
  const crimesByCityAndNeighborhood: Record<string, Record<string, { count: number, bairros: Set<string> }>> = {};
  
  // Initialize counters for each city
  unitArea.forEach(location => {
    crimesByCityAndNeighborhood[location.city] = {
      'Letalidade Violenta': { count: 0, bairros: new Set() },
      'Roubo de Veículo': { count: 0, bairros: new Set() },
      'Roubo de Rua': { count: 0, bairros: new Set() },
      'Roubo de Carga': { count: 0, bairros: new Set() }
    };
  });

  // Count crimes by city and type using the new field names
  crimes.forEach(crime => {
    const municipio = crime['Municipio do fato (IBGE)'];
    const tipo = crime['Indicador estrategico'];
    const bairro = crime['Bairro'] || 'Não informado';
    
    // Se município ou tipo são null, ignorar este crime
    if (!municipio || !tipo) return;
    
    const cityMatch = unitArea.find(location => 
      location.city === municipio
    );

    if (cityMatch) {
      let crimeType: string;
      switch (tipo.toLowerCase()) {
        case 'letalidade violenta':
          crimeType = 'Letalidade Violenta';
          break;
        case 'roubo de rua':
          crimeType = 'Roubo de Rua';
          break;
        case 'roubo de veículo':
          crimeType = 'Roubo de Veículo';
          break;
        case 'roubo de carga':
          crimeType = 'Roubo de Carga';
          break;
        default:
          console.log(`Tipo de crime não reconhecido: ${tipo}`);
          return;
      }

      if (crimesByCityAndNeighborhood[cityMatch.city][crimeType]) {
        crimesByCityAndNeighborhood[cityMatch.city][crimeType].count++;
        crimesByCityAndNeighborhood[cityMatch.city][crimeType].bairros.add(bairro);
      }
    }
  });

  // Generate heat map data
  const result = unitArea.flatMap(location => {
    const cityData = crimesByCityAndNeighborhood[location.city];
    const cityEntries = Object.entries(cityData)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        id: `${location.city}-${type}`,
        date: new Date().toISOString(), // Convert to ISO string
        type: type as CrimeType,
        unit: unit as PoliceUnit,
        region: 'RISP 5' as PoliceRegion,  // Fixed region type
        count: data.count,
        lat: location.lat,
        lng: location.lng,
        target: 0  // Add required target property with default value
      }));
    
    return cityEntries;
  });
  
  console.log(`Gerados ${result.length} pontos de dados para o mapa de calor`);
  return result;
};

export const UnitDashboard: React.FC = () => {
  const { unit } = useParams<{ unit: string }>();
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  
  // States
  const [loading, setLoading] = useState(true);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LocalCrimeData[]>([]);  // Use LocalCrimeData instead
  const [cardData, setCardData] = useState({
    letalidadeViolenta: 0,
    rouboDeVeiculo: 0,
    rouboDeRua: 0,
    rouboDeCarga: 0
  });
  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});
  const [selectedFilters, setSelectedFilters] = useState({
    date: '',
    type: '',
    city: '',
    neighborhood: '',
    ro: '',
    timeRange: ''
  });
  const [visibleItems, setVisibleItems] = useState(10);
  const [crimesWithHistory, setCrimesWithHistory] = useState<Set<string>>(new Set());

  // Memoized values
  const sortedCrimes = useMemo(() => 
    [...crimes].sort((a, b) => {
      const compareCity = (a['Municipio do fato (IBGE)'] || '').localeCompare(b['Municipio do fato (IBGE)'] || '');
      if (compareCity !== 0) return compareCity;
      
      const dateA = new Date(a['Ano do registro'], parseInt(a['Mes do registro']) - 1, parseInt(a['Dia do registro']));
      const dateB = new Date(b['Ano do registro'], parseInt(b['Mes do registro']) - 1, parseInt(b['Dia do registro']));
      return dateB.getTime() - dateA.getTime();
    }), [crimes]
  );

  const filteredCrimes = useMemo(() => 
    sortedCrimes.filter(crime => {
      const date = `${crime['Dia do registro']}/${crime['Mes do registro']}/${crime['Ano do registro']}`;
      const type = crime['Indicador estrategico']?.toLowerCase() || '';
      const city = crime['Municipio do fato (IBGE)'] || '';
      const neighborhood = crime['Bairro'] || '';
      const ro = (crime['RO'] || '').trim();
      const timeRange = crime['Faixa horaria'] || '';

      return (!selectedFilters.date || date.includes(selectedFilters.date)) &&
             (!selectedFilters.type || type.includes(selectedFilters.type.toLowerCase())) &&
             (!selectedFilters.city || city.toLowerCase().includes(selectedFilters.city.toLowerCase())) &&
             (!selectedFilters.neighborhood || neighborhood.toLowerCase().includes(selectedFilters.neighborhood.toLowerCase())) &&
             (!selectedFilters.ro || ro.includes(selectedFilters.ro.trim())) &&
             (!selectedFilters.timeRange || timeRange.toLowerCase().includes(selectedFilters.timeRange.toLowerCase()));
    }), [sortedCrimes, selectedFilters]
  );

  const uniqueValues = useMemo(() => {
    // Array de referência para ordenação dos horários
    const timeOrder = ['0h às 5h59', '6h às 11h59', '12h às 17h59', '18h às 23h59'];
    
    const sortTimeRanges = (times: string[]) => {
      return [...times].sort((a, b) => {
        const indexA = timeOrder.indexOf(a);
        const indexB = timeOrder.indexOf(b);
        return indexA - indexB;
      });
    };

    return {
      type: Array.from(new Set(sortedCrimes.map(crime => crime['Indicador estrategico']?.toLowerCase())))
        .filter(Boolean)
        .sort(),
      city: Array.from(new Set(sortedCrimes.map(crime => crime['Municipio do fato (IBGE)'])))
        .filter(Boolean)
        .sort(),
      neighborhood: Array.from(new Set(sortedCrimes.map(crime => crime['Bairro'])))
        .filter(Boolean)
        .sort(),
      timeRange: sortTimeRanges(Array.from(new Set(sortedCrimes.map(crime => crime['Faixa horaria'])))
        .filter(Boolean))
    };
  }, [sortedCrimes]);

  // Handlers
  const handleFilterChange = (column: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Modificando o handleScroll para melhorar a detecção do final da rolagem
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    // Se o usuário rolou até 100px do final, carregamos mais itens
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleItems(prev => Math.min(prev + 10, filteredCrimes.length));
    }
  }, [filteredCrimes.length]);

  // Effects
  useEffect(() => {
    const tableContainer = tableRef.current;
    if (tableContainer) {
      // Adicionando um listener de log para debug
      console.log("Adicionando evento de scroll ao container da tabela");
      
      // Usando um debounce para evitar muitas chamadas de handleScroll
      let scrollTimeout: NodeJS.Timeout | null = null;
      
      const debouncedHandleScroll = (e: Event) => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
          handleScroll(e);
        }, 100);
      };
      
      tableContainer.addEventListener('scroll', debouncedHandleScroll);
      return () => {
        console.log("Removendo evento de scroll do container da tabela");
        tableContainer.removeEventListener('scroll', debouncedHandleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    setVisibleItems(10);
  }, [selectedFilters]);

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
      console.log(`Carregando dados para a unidade: ${unit}`);
      const { data: crimes, error } = await supabaseAdmin
        .from(getTableName('CRIMES'))
        .select('*')
        .eq('AISP do fato', unit);

      if (error) {
        console.error('Erro ao buscar crimes:', error);
        setError('Erro ao buscar crimes: ' + error.message);
        return;
      }

      console.log(`Encontrados ${crimes?.length || 0} crimes para a unidade ${unit}`);

      // Se não houver crimes, definir estado vazio
      if (!crimes || crimes.length === 0) {
        setCrimes([]);
        setMapData([]);
        setCardData({
          letalidadeViolenta: 0,
          rouboDeVeiculo: 0,
          rouboDeRua: 0,
          rouboDeCarga: 0
        });
        setCrimesWithHistory(new Set());
        setLoading(false);
        return;
      }

      const newCardData = {
        letalidadeViolenta: 0,
        rouboDeVeiculo: 0,
        rouboDeRua: 0,
        rouboDeCarga: 0
      };
      crimes.forEach((crime: any) => {
        const indicator = crime['Indicador estrategico']?.toLowerCase() || '';
        
        if (indicator === 'letalidade violenta') {
          newCardData.letalidadeViolenta += 1;
        } else if (indicator === 'roubo de rua') {
          newCardData.rouboDeRua += 1;
        } else if (indicator === 'roubo de veículo') {
          newCardData.rouboDeVeiculo += 1;
        } else if (indicator === 'roubo de carga') {
          newCardData.rouboDeCarga += 1;
        }
      });

      setCardData(newCardData);
      setCrimes(crimes || []);

      // Buscar quais ROs possuem histórico
      if (crimes && crimes.length > 0) {
        const ros = crimes.map((crime) => crime.RO);
        // Verificar quais ROs têm histórico
        const { data: historiesData } = await supabaseAdmin
          .from(getTableName('HISTORY'))
          .select('ro')
          .in('ro', ros);
          
        if (historiesData && historiesData.length > 0) {
          // Criar um Set com os ROs que têm histórico
          const roWithHistorySet = new Set(historiesData.map(h => h.ro));
          setCrimesWithHistory(roWithHistorySet);
          console.log(`Encontrados ${roWithHistorySet.size} ROs com histórico`);
        } else {
          setCrimesWithHistory(new Set());
        }
      }
      
      console.log('Gerando dados para o mapa de calor...');
      const mapDataGenerated = generateHeatMapData(unit, crimes);
      console.log(`Dados do mapa gerados: ${mapDataGenerated.length} pontos`);
      
      if (mapDataGenerated.length > 0) {
        setMapData(mapDataGenerated);
      } else {
        // Criar um ponto de dados falso para garantir que o mapa seja exibido
        console.log('Criando dados de exemplo para o mapa...');
        const center = UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS];
        if (center) {
          const dummyData: LocalCrimeData[] = [{
            id: `${unit}-dummy`,
            date: new Date().toISOString(),
            type: 'Letalidade Violenta',
            unit: unit as PoliceUnit,
            region: 'RISP 5' as PoliceRegion,  // Fixed region type
            count: 1,
            lat: center.lat,
            lng: center.lng,
            target: 0
          }];
          setMapData(dummyData);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = useMemo(() => {
    if (!crimes.length) return null;

    // Contadores
    const tipoCount: Record<string, number> = {};
    const horarioCount: Record<string, { [tipo: string]: number }> = {};
    const cidadeBairroCount: Record<string, { 
      total: number, 
      tipos: Record<string, number>,
      bairros: Record<string, number>
    }> = {};

    // Primeiro, contar os tipos de crime e inicializar contadores
    crimes.forEach(crime => {
      const tipo = crime['Indicador estrategico']?.toLowerCase() || '';
      const cidade = crime['Municipio do fato (IBGE)'];
      const bairro = crime['Bairro'];
      const horario = crime['Faixa horaria'];

      // Contar tipos de crime
      tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;

      // Inicializar ou atualizar contadores de horário por tipo
      if (!horarioCount[horario]) {
        horarioCount[horario] = {};
      }
      horarioCount[horario][tipo] = (horarioCount[horario][tipo] || 0) + 1;

      // Inicializar ou atualizar contadores de cidade e bairro
      if (!cidadeBairroCount[cidade]) {
        cidadeBairroCount[cidade] = {
          total: 0,
          tipos: {},
          bairros: {}
        };
      }
      cidadeBairroCount[cidade].total++;
      cidadeBairroCount[cidade].tipos[tipo] = (cidadeBairroCount[cidade].tipos[tipo] || 0) + 1;
      cidadeBairroCount[cidade].bairros[bairro] = (cidadeBairroCount[cidade].bairros[bairro] || 0) + 1;
    });

    // Encontrar o tipo mais frequente
    const tipoMaisFrequente = Object.entries(tipoCount)
      .sort((a, b) => b[1] - a[1])[0];

    // Encontrar os horários mais frequentes para o tipo mais frequente
    const horariosMaisFrequentes = Object.entries(horarioCount)
      .map(([horario, tipos]) => ({
        horario,
        count: tipos[tipoMaisFrequente[0]] || 0
      }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count);

    const maxHorarioCount = horariosMaisFrequentes[0]?.count || 0;
    const horariosMaisFrequentesResult = {
      items: horariosMaisFrequentes
        .filter(h => h.count === maxHorarioCount)
        .map(h => h.horario),
      count: maxHorarioCount
    };

    // Encontrar as cidades com mais casos do tipo mais frequente
    const cidadesMaisFrequentes = Object.entries(cidadeBairroCount)
      .map(([cidade, dados]) => ({
        cidade,
        count: dados.tipos[tipoMaisFrequente[0]] || 0,
        bairros: Object.entries(dados.bairros)
          .sort((a, b) => b[1] - a[1])
          .map(([bairro, count]) => ({ bairro, count }))
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    const maxCidadeCount = cidadesMaisFrequentes[0]?.count || 0;
    const cidadesMaisFrequentesResult = {
      items: cidadesMaisFrequentes
        .filter(c => c.count === maxCidadeCount)
        .map(c => ({
          nome: c.cidade,
          bairros: c.bairros
        })),
      count: maxCidadeCount
    };

    return {
      tipo: {
        nome: tipoMaisFrequente[0],
        total: tipoMaisFrequente[1]
      },
      horarios: horariosMaisFrequentesResult,
      cidades: cidadesMaisFrequentesResult
    };
  }, [crimes]);

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
    const type = crime['Indicador estrategico']?.toLowerCase() || 'outros';
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
      value,
      percentage: ((value / crimes.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value);

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
                        label={({ name, value, percentage }) => `${name} (${value} - ${percentage}%)`}
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
                {console.log('Renderizando mapa com:', {
                  mapDataLength: mapData.length,
                  unit,
                  hasCenter: !!unit && !!UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS]
                })}
                {mapData.length > 0 && unit && UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS] ? (
                  <CrimeMap 
                    key={`map-${unit}-${mapData.length}`}
                    data={mapData}
                    center={UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS]}
                    zoom={UNIT_ZOOM[unit as keyof typeof UNIT_ZOOM] || 10}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    {!unit ? "Unidade não especificada" : 
                     !UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS] ? "Centro da unidade não definido" :
                     mapData.length === 0 ? "Sem dados para exibir no mapa" : 
                     "Carregando mapa..."}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Ocorrências */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-lg font-semibold mb-4 text-black">Ocorrências {unit}</h2>
              <div className="overflow-x-auto">
                <div 
                  ref={tableRef}
                  className="max-h-[600px] overflow-y-auto" 
                  style={{ height: '500px' }}
                  onScroll={(e) => {
                    // Adicionando um manipulador de eventos diretamente no JSX para garantir que o scroll funcione
                    const target = e.currentTarget;
                    const { scrollTop, scrollHeight, clientHeight } = target;
                    if (scrollHeight - scrollTop - clientHeight < 100) {
                      setVisibleItems(prev => Math.min(prev + 10, filteredCrimes.length));
                    }
                  }}
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <div className="flex flex-col gap-2">
                            <span>Data</span>
                            <input
                              type="text"
                              placeholder="Filtrar por data..."
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedFilters.date}
                              onChange={(e) => handleFilterChange('date', e.target.value)}
                            />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <div className="flex flex-col gap-2">
                            <span>RO</span>
                            <input
                              type="text"
                              placeholder="Filtrar por RO..."
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedFilters.ro}
                              onChange={(e) => handleFilterChange('ro', e.target.value)}
                            />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <div className="flex flex-col gap-2">
                            <span>Tipo</span>
                            <select
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedFilters.type}
                              onChange={(e) => handleFilterChange('type', e.target.value)}
                            >
                              <option value="">Todos</option>
                              {uniqueValues.type.map((type) => (
                                <option key={type} value={type} className="capitalize">{type}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <div className="flex flex-col gap-2">
                            <span>Município</span>
                            <select
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedFilters.city}
                              onChange={(e) => handleFilterChange('city', e.target.value)}
                            >
                              <option value="">Todos</option>
                              {uniqueValues.city.map((city) => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <div className="flex flex-col gap-2">
                            <span>Bairro</span>
                            <select
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedFilters.neighborhood}
                              onChange={(e) => handleFilterChange('neighborhood', e.target.value)}
                            >
                              <option value="">Todos</option>
                              {uniqueValues.neighborhood.map((neighborhood) => (
                                <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          <div className="flex flex-col gap-2">
                            <span>Horário</span>
                            <select
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedFilters.timeRange}
                              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                            >
                              <option value="">Todos</option>
                              {uniqueValues.timeRange.map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCrimes.slice(0, visibleItems).map((crime) => {
                        const hasHistory = crimesWithHistory.has(crime['RO']);
                        return (
                          <tr 
                            key={crime.objectid} 
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${hasHistory ? 'bg-blue-50' : ''}`}
                            onClick={() => navigate(`/crime/${crime['RO']}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {`${crime['Dia do registro']}/${crime['Mes do registro']}/${crime['Ano do registro']}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {crime['RO']}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {crime['Indicador estrategico']?.toLowerCase()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {crime['Municipio do fato (IBGE)']}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {crime['Bairro']}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {crime['Faixa horaria']}
                            </td>
                          </tr>
                        );
                      })}
                      {visibleItems < filteredCrimes.length && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            Role para baixo para ver mais ocorrências...
                            <button 
                              className="ml-2 px-4 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md" 
                              onClick={() => setVisibleItems(prev => Math.min(prev + 20, filteredCrimes.length))}
                            >
                              Carregar mais
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Loading indicator */}
                  {visibleItems < filteredCrimes.length && (
                    <div className="py-4 text-center">
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                      <span className="ml-2 text-gray-500">Carregando mais...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 text-right">
                Mostrando {Math.min(visibleItems, filteredCrimes.length)} de {filteredCrimes.length} ocorrências
                {crimesWithHistory.size > 0 && (
                  <span className="ml-2">
                    (<span className="text-blue-500">{crimesWithHistory.size}</span> com histórico)
                  </span>
                )}
              </div>
            </div>

            {/* Análise Prévia */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-black">Análise Prévia</h2>
              <div className="prose prose-sm">
                {generateAnalysis && (
                  <p className="text-gray-700 leading-relaxed">
                    Em uma análise prévia da {unit}, verifica-se que o tipo de crime mais frequente é{' '}
                    <span className="font-semibold capitalize">{generateAnalysis.tipo.nome}</span>{' '}
                    com {generateAnalysis.tipo.total} casos do total de {crimes.length} ocorrências.
                    {generateAnalysis.horarios.items.length > 0 && (
                      <>
                        <br />
                        Estas ocorrências concentram-se{' '}
                        {generateAnalysis.horarios.items.length > 1 ? (
                          <>
                            nos horários de <span className="font-semibold">{generateAnalysis.horarios.items.join(' e ')}</span>
                          </>
                        ) : (
                          <>
                            no horário de <span className="font-semibold">{generateAnalysis.horarios.items[0]}</span>
                          </>
                        )}
                        {' '}({generateAnalysis.horarios.count} casos).
                      </>
                    )}
                    {generateAnalysis.cidades.items.length > 0 && (
                      <>
                        <br />
                        Geograficamente, {generateAnalysis.cidades.items.length > 1 ? 'destacam-se as cidades' : 'destaca-se a cidade de '}{' '}
                        {generateAnalysis.cidades.items.map((cidade, index, array) => (
                          <span key={`city-${cidade.nome}-${index}`}>
                            {index > 0 && index === array.length - 1 ? ' e ' : index > 0 ? ', ' : ''}
                            <span className="font-semibold">{cidade.nome} </span>
                          </span>
                        ))}
                        com {generateAnalysis.cidades.count} {generateAnalysis.cidades.count === 1 ? 'caso' : 'casos'}{' '}
                        {generateAnalysis.cidades.items.map((cidade, cidadeIndex) => (
                          <span key={`city-details-${cidade.nome}-${cidadeIndex}`}>
                            {cidade.bairros.length > 0 && (
                              <span>
                                {cidadeIndex === 0 ? `de ${generateAnalysis.tipo.nome} nos seguintes bairros: ` : ' e nos seguintes bairros: '}
                                {cidade.bairros.map((b, idx, arr) => (
                                  <span key={`bairro-${b.bairro}-${idx}`}>
                                    {idx > 0 && idx === arr.length - 1 ? ' e ' : idx > 0 ? ', ' : ''}
                                    {b.bairro} ({b.count} {b.count === 1 ? 'caso' : 'casos'})
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        ))}.
                      </>
                    )}
                  </p>
                )}
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