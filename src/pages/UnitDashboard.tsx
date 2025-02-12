import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { Filters } from '../components/Filters';
import { CrimeMap } from '../components/CrimeMap';
import { ImportButton } from '../components/ImportButton';
import type { Filters as FiltersType, CrimeData, CrimeType, TimeRange, PoliceUnit } from '../types';
import { crimeService } from '../services/crimeService';

const COLORS = {
  'Letalidade Violenta': '#ff7f0e',
  'Roubo de Veículo': '#2ca02c',
  'Roubo de Rua': '#d62728',
  'Roubo de Carga': '#9467bd'
};

const BATTALION_COLORS = {
  '10o BPM': '#1f77b4',
  '28o BPM': '#ff7f0e',
  '33o BPM': '#2ca02c',
  '37o BPM': '#d62728',
  '2a CIPM': '#9467bd'
};

// Define battalion areas with their coordinates
const BATTALION_AREAS = {
  '10o BPM': [
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
  '28o BPM': [
    { city: 'Volta Redonda', lat: -22.5202, lng: -44.0996 },
    { city: 'Barra Mansa', lat: -22.5446, lng: -44.1751 },
    { city: 'Pinheiral', lat: -22.5172, lng: -44.0022 }
  ],
  '33o BPM': [
    { city: 'Mangaratiba', lat: -22.9594, lng: -44.0409 },
    { city: 'Angra dos Reis', lat: -23.0067, lng: -44.3181 },
    { city: 'Rio Claro', lat: -22.7205, lng: -44.1419 }
  ],
  '37o BPM': [
    { city: 'Resende', lat: -22.4705, lng: -44.4509 },
    { city: 'Itatiaia', lat: -22.4961, lng: -44.5634 },
    { city: 'Porto Real', lat: -22.4175, lng: -44.2952 },
    { city: 'Quatis', lat: -22.4043, lng: -44.2597 }
  ],
  '2a CIPM': [
    { city: 'Paraty', lat: -23.2178, lng: -44.7131 }
  ]
};

interface CrimeMetrics {
  name: CrimeType;
  actual: number;
  target: number;
  difference: number;
}

const generateCrimeMetrics = (unit: string, crimeData: CrimeData[]): CrimeMetrics[] => {
  // Extract crime data for the specified unit
  const crimeMetrics = crimeData.map((crime) => {
    return {
      name: crime.type as CrimeType,
      actual: crime.count,
      target: 75,
      difference: crime.count - 75
    };
  });

  return crimeMetrics;
};

// Update the generateTimeSeriesData function to include card visualization data
const generateTimeSeriesData = (timeRange: TimeRange, unit: string, timeSeriesData: any[]) => {
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

export const UnitDashboard: React.FC = () => {
  const { unit } = useParams<{ unit: string }>();
  const [filters, setFilters] = useState<FiltersType>({ timeRange: 'M' });
  const [loading, setLoading] = useState(true);
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  const loadData = async () => {
    if (!unit) return;
    
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();
      
      switch(filters.timeRange) {
        case 'D':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'W':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const [crimes, timeSeries] = await Promise.all([
        crimeService.getCrimesByUnit(unit as PoliceUnit),
        crimeService.getTimeSeriesData(unit as PoliceUnit, startDate, now)
      ]);

      setCrimeData(crimes);
      setTimeSeriesData(timeSeries);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [unit, filters.timeRange]);

  const crimeMetrics = useMemo(() => generateCrimeMetrics(unit || '', crimeData), [unit, crimeData]);

  const mockCrimeDistribution = useMemo(() => {
    const crimeDistribution = crimeData.map((crime) => {
      return {
        name: crime.type as CrimeType,
        value: crime.count
      };
    });

    return crimeDistribution;
  }, [crimeData]);

  const mockComparisonData = useMemo(() => {
    return Object.keys(BATTALION_COLORS).map(battalion => {
      const crimeData = crimeService.getCrimesByUnit(battalion as PoliceUnit);
      return {
        crimeType: battalion,
        'Letalidade Violenta': crimeData['Letalidade Violenta'] || 0,
        'Roubo de Veículo': crimeData['Roubo de Veículo'] || 0,
        'Roubo de Rua': crimeData['Roubo de Rua'] || 0,
        'Roubo de Carga': crimeData['Roubo de Carga'] || 0
      };
    });
  }, []);

  const generateHeatMapData = (unit: string, crimeData: CrimeData[]) => {
    const battalionArea = BATTALION_AREAS[unit as keyof typeof BATTALION_AREAS] || [];
    
    return battalionArea.flatMap(location => {
      const crimeCounts = crimeData.map((crime) => {
        return {
          id: `${location.city}-${crime.id}`,
          date: crime.date,
          type: crime.type as CrimeType,
          unit: unit as any,
          count: crime.count,
          target: 75,
          lat: location.lat + (Math.random() - 0.5) * 0.02,
          lng: location.lng + (Math.random() - 0.5) * 0.02,
          shift: 'Manhã',
          region: location.city
        };
      });

      return crimeCounts;
    });
  };

  const mockMapData: CrimeData[] = useMemo(
    () => generateHeatMapData(unit || '', crimeData),
    [unit, crimeData]
  );

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Filters value={filters} onChange={setFilters} />
                <ImportButton onImportSuccess={loadData} />
              </div>
            </div>

            {/* Crime Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {crimeMetrics.map((metric) => (
                <div key={metric.name} className="bg-white p-4 rounded-lg shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-600">{metric.name}</h3>
                  <p className="text-2xl font-bold mt-2">{metric.actual}</p>
                  <p className="text-sm text-gray-500">
                    Meta: {metric.target} | Diferença: {metric.difference}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1">
                {/* Temporal Evolution Graph */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                  <h2 className="text-xl font-bold mb-4 font-['Roboto']">
                    Evolução Temporal
                  </h2>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={timeSeriesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={formatDate}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <ReferenceLine 
                          y={75} 
                          stroke="#666" 
                          strokeDasharray="3 3"
                          label={{ value: 'Meta', position: 'right' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          name="Meta"
                          stroke="#666"
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="occurrences"
                          name="Ocorrências"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          stroke={(dataPoint: any) => dataPoint.occurrences > dataPoint.target ? '#ef4444' : '#22c55e'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Crime Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-bold mb-4 font-['Roboto']">
                    Distribuição por Tipo de Crime
                  </h2>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockCrimeDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          label={PieChartLabel}
                          labelLine={false}
                        >
                          {mockCrimeDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[entry.name as CrimeType]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                {/* Battalion Comparison Chart */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                  <h2 className="text-xl font-bold mb-4 font-['Roboto']">
                    Comparativo com Outros Batalhões
                  </h2>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="crimeType" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {Object.keys(BATTALION_COLORS).map((battalion) => (
                          <Bar
                            key={battalion}
                            dataKey={battalion}
                            fill={BATTALION_COLORS[battalion as keyof typeof BATTALION_COLORS]}
                            stackId="stack"
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Heat Map */}
                <div className="bg-white p-6 rounded-lg shadow-lg" style={{ position: 'relative' }}>
                  <h2 className="text-xl font-bold mb-4 font-['Roboto']">
                    Mapa de Calor
                  </h2>
                  <div className="h-[400px]">
                    <CrimeMap data={mockMapData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
