import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';  // Removed useNavigate
import { ArrowLeft } from 'lucide-react';
import { getSupabaseAdmin, getTableName } from '../config/supabase';
import { toast } from 'react-hot-toast';
import { historyService, HistoryData } from '../services/historyService';

export const CrimeHistory: React.FC = () => {
  // Extrair ro dos parâmetros, mas precisamos também verificar o restante da URL
  // pois o React Router pode ter dividido o RO completo devido à barra
  const { ro } = useParams<{ ro: string }>();
  const location = useLocation();
  
  // Reconstruir o RO completo a partir do path da URL
  const fullRO = React.useMemo(() => {
    // Se o path contém mais segmentos além de /crime/parte-inicial
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length > 3) {
      // Reconstruir o RO completo juntando a parte inicial com o resto do caminho
      return pathSegments.slice(2).join('/');
    }
    // Caso contrário, usar apenas o parâmetro ro
    return ro || '';
  }, [ro, location.pathname]);

  const [crimeData, setCrimeData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrimeDetails = async () => {
      try {
        setLoading(true);
        console.log(`Buscando detalhes para o RO: ${fullRO}`);
        
        // Buscar informações do crime usando a tabela correta
        const { data: crimeDetail, error: crimeError } = await getSupabaseAdmin()
          .from(getTableName('CRIMES'))
          .select('*')
          .eq('RO', fullRO)
          .single();

        if (crimeError) {
          console.error('Erro ao buscar detalhes do crime:', crimeError);
          throw crimeError;
        }
        
        if (!crimeDetail) {
          console.error('Registro não encontrado para RO:', fullRO);
          throw new Error('Registro não encontrado');
        }
        
        console.log('Dados do crime encontrados:', crimeDetail);
        setCrimeData(crimeDetail);

        // Buscar o histórico relacionado a este RO usando o serviço
        // Modificado para ordenar por created_at descendente e pegar apenas o mais recente
        try {
          console.log(`Buscando histórico para o RO: ${fullRO}`);
          const histories = await historyService.getHistoryByRO(fullRO);
          console.log(`Encontrados ${histories.length} históricos`);
          
          // Se houver histórico, pegamos apenas o mais recente (o primeiro, já que estão ordenados por created_at desc)
          if (histories.length > 0) {
            setHistoryData([histories[0]]);
          } else {
            setHistoryData([]);
          }
        } catch (historyErr: any) {
          console.error('Erro ao buscar histórico:', historyErr);
          // Não interrompe o fluxo se não conseguir carregar o histórico
          toast.error('Erro ao carregar histórico: ' + historyErr.message);
        }

      } catch (err: any) {
        setError(err.message);
        toast.error('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (fullRO) {
      fetchCrimeDetails();
    }
  }, [fullRO]);

  const getFieldValue = (field: string): string => {
    // Verificar várias possibilidades de capitalização para garantir que encontremos o campo
    const normalizedField = field.toLowerCase();
    
    if (!crimeData) return '';
    
    const keys = Object.keys(crimeData);
    const matchingKey = keys.find(key => key.toLowerCase() === normalizedField);
    
    return matchingKey ? crimeData[matchingKey]?.toString() || '' : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  if (error || !crimeData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">
          {error || 'Registro de ocorrência não encontrado'}
        </div>
      </div>
    );
  }

  const unitField = getFieldValue('AISP do fato') || getFieldValue('aisp do fato') || '';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to={`/unit/${unitField}`} className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">RO: {fullRO}</h1>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Gerais</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Data do Registro</label>
                      <span className="text-base text-gray-900">
                        {`${getFieldValue('Dia do registro') || getFieldValue('dia do registro')}/${getFieldValue('Mes do registro') || getFieldValue('mes do registro')}/${getFieldValue('Ano do registro') || getFieldValue('ano do registro')}`}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Tipo</label>
                      <span className="text-base text-gray-900 capitalize">
                        {(getFieldValue('Indicador estrategico') || getFieldValue('indicador estrategico'))?.toLowerCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Faixa Horária</label>
                      <span className="text-base text-gray-900">{getFieldValue('Faixa horaria') || getFieldValue('faixa horaria')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">AISP</label>
                      <span className="text-base text-gray-900">{getFieldValue('AISP do fato') || getFieldValue('aisp do fato')}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Município</label>
                      <span className="text-base text-gray-900">{getFieldValue('Municipio do fato (IBGE)') || getFieldValue('municipio do fato (ibge)')}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Bairro</label>
                      <span className="text-base text-gray-900">{getFieldValue('Bairro') || getFieldValue('bairro')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados Complementares</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {Object.entries(crimeData)
                    .filter(([key]) => {
                      const lowerKey = key.toLowerCase();
                      return !['objectid', 'id', 'created_at'].includes(lowerKey) && 
                        !lowerKey.match(/^(dia|mes|ano|aisp|municipio|bairro|ro|indicador estrategico|faixa horaria)/i);
                    })
                    .map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-500">{key}</label>
                        <span className="text-base text-gray-900">{value?.toString() || '-'}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            
            {/* Seção de histórico da ocorrência - Modificado para mostrar apenas a última atualização */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Último Histórico da Ocorrência</h2>
              {historyData.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-6">
                    {historyData.map((history) => (
                      <div key={history.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-md font-medium text-gray-900">
                            Atualização #{history.id}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {new Date(history.created_at || '').toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700 whitespace-pre-line">
                          {history.historico}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Nenhum histórico registrado para esta ocorrência.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};