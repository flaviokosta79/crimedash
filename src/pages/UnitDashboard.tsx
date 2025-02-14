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
import { supabase } from '../config/supabase';

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
  actual: number;
  target: number;
  difference: number;
}

const generateCrimeMetrics = (unit: string, crimeData: any[]): CrimeMetrics[] => {
  // Extract crime data for the specified unit
  const crimeMetrics = crimeData.map((crime) => {
    return {
      name: crime.type,
      actual: crime.count,
      target: 75,
      difference: crime.count - 75
    };
  });

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
  const [mapData, setMapData] = useState<CrimeData[]>([]);
  const [unitData, setUnitData] = useState({
    total: 0,
    lethal_violence: 0,
    street_robbery: 0,
    vehicle_robbery: 0,
    cargo_robbery: 0
  });
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    if (unit) {
      loadData();
      loadComparisonData();
    }
  }, [unit]);

  const loadData = async () => {
    if (!unit) return;

    try {
      const { data: crimes, error } = await supabase
        .from('crimes')
        .select('*')
        .eq('aisp', unit)
        .order('data_fato', { ascending: false });

      if (error) {
        console.error('Erro ao buscar crimes:', error);
        return;
      }

      const newUnitData = {
        total: 0,
        lethal_violence: 0,
        street_robbery: 0,
        vehicle_robbery: 0,
        cargo_robbery: 0
      };

      crimes?.forEach((crime: any) => {
        newUnitData.total++;

        const tipo = crime.indicador_estrategico?.toLowerCase() || '';

        switch (tipo) {
          case 'letalidade violenta':
            newUnitData.lethal_violence++;
            break;
          case 'roubo de rua':
            newUnitData.street_robbery++;
            break;
          case 'roubo de veículo':
            newUnitData.vehicle_robbery++;
            break;
          case 'roubo de carga':
            newUnitData.cargo_robbery++;
            break;
        }
      });

      const mapDataGenerated = generateHeatMapData(unit, crimes || []);
      setMapData(mapDataGenerated);
      setUnitData(newUnitData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadComparisonData = async () => {
    try {
      const { data: crimes, error } = await supabase
        .from('crimes')
        .select('*')
        .in('aisp', ['AISP 10', 'AISP 28', 'AISP 33', 'AISP 37', 'AISP 43']);

      if (error) {
        console.error('Erro ao buscar dados de comparação:', error);
        return;
      }

      const unitsData: Record<string, any> = {
        'AISP 10': {
          name: 'AISP 10',
          'Letalidade Violenta': 0,
          'Roubo de Veículo': 0,
          'Roubo de Rua': 0,
          'Roubo de Carga': 0
        },
        'AISP 28': {
          name: 'AISP 28',
          'Letalidade Violenta': 0,
          'Roubo de Veículo': 0,
          'Roubo de Rua': 0,
          'Roubo de Carga': 0
        },
        'AISP 33': {
          name: 'AISP 33',
          'Letalidade Violenta': 0,
          'Roubo de Veículo': 0,
          'Roubo de Rua': 0,
          'Roubo de Carga': 0
        },
        'AISP 37': {
          name: 'AISP 37',
          'Letalidade Violenta': 0,
          'Roubo de Veículo': 0,
          'Roubo de Rua': 0,
          'Roubo de Carga': 0
        },
        'AISP 43': {
          name: 'AISP 43',
          'Letalidade Violenta': 0,
          'Roubo de Veículo': 0,
          'Roubo de Rua': 0,
          'Roubo de Carga': 0
        }
      };

      crimes?.forEach((crime: any) => {
        const aisp = crime.aisp;
        const tipo = crime.indicador_estrategico?.toLowerCase() || '';

        if (unitsData[aisp]) {
          switch (tipo) {
            case 'letalidade violenta':
              unitsData[aisp]['Letalidade Violenta']++;
              break;
            case 'roubo de rua':
              unitsData[aisp]['Roubo de Rua']++;
              break;
            case 'roubo de veículo':
              unitsData[aisp]['Roubo de Veículo']++;
              break;
            case 'roubo de carga':
              unitsData[aisp]['Roubo de Carga']++;
              break;
          }
        }
      });

      setComparisonData(Object.values(unitsData));
    } catch (error) {
      console.error('Error loading comparison data:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-semibold">{label instanceof Date ? formatDate(label) : label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{unit}</h1>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Crime Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-semibold text-gray-600">Letalidade Violenta</h3>
                <p className="text-2xl font-bold mt-2" style={{ color: CRIME_COLORS['Letalidade Violenta'] }}>
                  {unitData.lethal_violence}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-semibold text-gray-600">Roubo de Veículo</h3>
                <p className="text-2xl font-bold mt-2" style={{ color: CRIME_COLORS['Roubo de Veículo'] }}>
                  {unitData.vehicle_robbery}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-semibold text-gray-600">Roubo de Rua</h3>
                <p className="text-2xl font-bold mt-2" style={{ color: CRIME_COLORS['Roubo de Rua'] }}>
                  {unitData.street_robbery}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-sm font-semibold text-gray-600">Roubo de Carga</h3>
                <p className="text-2xl font-bold mt-2" style={{ color: CRIME_COLORS['Roubo de Carga'] }}>
                  {unitData.cargo_robbery}
                </p>
              </div>
            </div>

            {/* Crime Distribution and Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 font-['Roboto']">
                  Distribuição de Crimes
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { id: 1, name: 'Letalidade Violenta', value: unitData.lethal_violence },
                          { id: 2, name: 'Roubo de Veículo', value: unitData.vehicle_robbery },
                          { id: 3, name: 'Roubo de Rua', value: unitData.street_robbery },
                          { id: 4, name: 'Roubo de Carga', value: unitData.cargo_robbery }
                        ].filter(item => item.value > 0)} // Filtra apenas valores maiores que 0
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={PieChartLabel}
                        labelLine={false}
                      >
                        {[
                          { id: 1, name: 'Letalidade Violenta', value: unitData.lethal_violence },
                          { id: 2, name: 'Roubo de Veículo', value: unitData.vehicle_robbery },
                          { id: 3, name: 'Roubo de Rua', value: unitData.street_robbery },
                          { id: 4, name: 'Roubo de Carga', value: unitData.cargo_robbery }
                        ]
                        .filter(item => item.value > 0) // Filtra apenas valores maiores que 0
                        .map((entry, index) => (
                          <Cell 
                            key={`crime-cell-${index}`}
                            fill={CRIME_COLORS[entry.name as keyof typeof CRIME_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 font-['Roboto']">
                  Comparação com Outras AISPs
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Letalidade Violenta" fill={CRIME_COLORS['Letalidade Violenta']} />
                      <Bar dataKey="Roubo de Veículo" fill={CRIME_COLORS['Roubo de Veículo']} />
                      <Bar dataKey="Roubo de Rua" fill={CRIME_COLORS['Roubo de Rua']} />
                      <Bar dataKey="Roubo de Carga" fill={CRIME_COLORS['Roubo de Carga']} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Heat Map */}
            <div className="grid grid-cols-1 gap-6">
              <h2 className="text-lg font-semibold mb-2">
                Mapa de Calor
              </h2>
              <div className="h-[500px]">
                <CrimeMap 
                  data={mapData} 
                  center={unit ? UNIT_CENTERS[unit as keyof typeof UNIT_CENTERS] : undefined}
                  zoom={unit ? UNIT_ZOOM[unit as keyof typeof UNIT_ZOOM] : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
