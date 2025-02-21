import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseAdmin } from '../config/supabase';
import { toast } from 'react-hot-toast';

export const CrimeHistory: React.FC = () => {
  const { ro } = useParams<{ ro: string }>();
  const navigate = useNavigate();
  const [crimeData, setCrimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrimeDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await getSupabaseAdmin()
          .from('crimes2')
          .select('*')
          .eq('RO', ro)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Registro não encontrado');
        
        setCrimeData(data);
      } catch (err: any) {
        setError(err.message);
        toast.error('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ro) {
      fetchCrimeDetails();
    }
  }, [ro]);

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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to={`/unit/${crimeData['AISP do fato']}`} className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">RO: {ro}</h1>
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
                        {`${crimeData['Dia do registro']}/${crimeData['Mes do registro']}/${crimeData['Ano do registro']}`}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Tipo</label>
                      <span className="text-base text-gray-900 capitalize">
                        {crimeData['Indicador estrategico']?.toLowerCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Faixa Horária</label>
                      <span className="text-base text-gray-900">{crimeData['Faixa horaria']}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">AISP</label>
                      <span className="text-base text-gray-900">{crimeData['AISP do fato']}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Município</label>
                      <span className="text-base text-gray-900">{crimeData['Municipio do fato (IBGE)']}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Bairro</label>
                      <span className="text-base text-gray-900">{crimeData['Bairro']}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados Complementares</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {Object.entries(crimeData)
                    .filter(([key]) => !['objectid', 'id', 'created_at'].includes(key))
                    .filter(([key, value]) => !key.match(/^(Dia|Mes|Ano|AISP|Municipio|Bairro|Numero da RO|Indicador estrategico|Faixa horaria)/))
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
          </div>
        </div>
      </div>
    </div>
  );
};