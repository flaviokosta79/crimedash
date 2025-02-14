import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Toaster, toast } from 'react-hot-toast';

interface Target {
  id: number;
  unit: string;
  crime_type: string;
  target_value: number;
  year: number;
  semester: number;
  created_at?: string;
  updated_at?: string;
}

export const Targets: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const navigate = useNavigate();

  const crimeTypes = [
    'letalidade violenta',
    'roubo de veículo',
    'roubo de rua',
    'roubo de carga'
  ];

  const units = [
    { type: 'AISP', numbers: ['10', '28', '33', '37', '43'] },
    { type: 'RISP', numbers: ['5'] }
  ];

  // Mapeamento dos ícones por tipo de crime
  const crimeIcons: Record<string, string> = {
    'letalidade violenta': '/images/icons/letalidade.svg',
    'roubo de veículo': '/images/icons/rouboveiculo.svg',
    'roubo de rua': '/images/icons/rouborua.svg',
    'roubo de carga': '/images/icons/roubocarga.svg'
  };

  // Função para ordenar os tipos de crime
  const sortCrimeTypes = (targets: Target[]) => {
    return targets.sort((a, b) => {
      const indexA = crimeTypes.indexOf(a.crime_type);
      const indexB = crimeTypes.indexOf(b.crime_type);
      if (indexA === indexB) {
        return a.unit.localeCompare(b.unit);
      }
      return indexA - indexB;
    });
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('year', 2025)
        .eq('semester', 1)
        .order('unit');

      if (error) throw error;

      // Ordenar os dados pelos tipos de crime na ordem definida
      setTargets(sortCrimeTypes(data || []));
    } catch (error: any) {
      console.error('Erro ao buscar metas:', error);
      setError(error.message);
      toast.error('Erro ao carregar as metas');
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = async (target: Target) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Atualizando meta:', target);
      
      // Primeiro, tenta atualizar
      const { error: updateError } = await supabase
        .from('targets')
        .update({ 
          target_value: target.target_value,
          updated_at: new Date().toISOString()
        })
        .eq('id', target.id);

      if (updateError) {
        console.error('Erro ao atualizar:', updateError);
        throw updateError;
      }

      // Depois, busca o registro atualizado
      const { data: updatedData, error: selectError } = await supabase
        .from('targets')
        .select('*')
        .eq('id', target.id)
        .single();

      if (selectError) {
        console.error('Erro ao buscar dado atualizado:', selectError);
        throw selectError;
      }

      if (updatedData) {
        console.log('Dado atualizado:', updatedData);
        setTargets(prevTargets => 
          prevTargets.map(t => t.id === target.id ? updatedData : t)
        );
        setEditingTarget(null);
        toast.success('Meta atualizada com sucesso!');
      } else {
        throw new Error('Registro não encontrado após atualização');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      setError(error.message);
      toast.error(`Erro ao atualizar a meta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar metas por unidade
  const targetsByUnit = targets.reduce((acc: Record<string, Target[]>, target) => {
    const unitKey = target.unit;
    if (!acc[unitKey]) {
      acc[unitKey] = [];
    }
    acc[unitKey].push(target);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Configuração de Metas</h1>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Voltar ao Dashboard
                </button>
              </div>
            </div>

            {/* Título do Semestre */}
            <div className="bg-gray-800 text-white rounded-lg p-6 shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-center">
                Metas 1º Semestre de 2025
              </h2>
            </div>

            {/* RISP Card */}
            <div className="w-full mb-8">
              {Object.entries(targetsByUnit)
                .filter(([unit]) => unit.startsWith('RISP'))
                .map(([unit, unitTargets]) => (
                  <div key={unit} className="bg-gray-800 rounded-lg shadow-lg p-6 text-white w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center">{unit}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {unitTargets.map((target) => (
                        <div key={target.id} className="flex items-center justify-between bg-gray-700 p-4 rounded">
                          <div className="flex items-center gap-2">
                            <img 
                              src={crimeIcons[target.crime_type]} 
                              alt={target.crime_type}
                              className="w-6 h-6"
                            />
                            <span className="capitalize text-lg">{target.crime_type}</span>
                          </div>
                          {editingTarget?.id === target.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-20 px-2 py-1 text-gray-900 border rounded"
                                value={editingTarget.target_value}
                                onChange={(e) => setEditingTarget({
                                  ...editingTarget,
                                  target_value: parseInt(e.target.value) || 0
                                })}
                                min="0"
                              />
                              <button
                                className="p-1 bg-green-500 rounded hover:bg-green-600"
                                onClick={() => updateTarget(editingTarget)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                className="p-1 bg-gray-500 rounded hover:bg-gray-600"
                                onClick={() => setEditingTarget(null)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xl">{target.target_value}</span>
                              <button
                                className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
                                onClick={() => setEditingTarget(target)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* AISP Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {Object.entries(targetsByUnit)
                .filter(([unit]) => unit.startsWith('AISP'))
                .map(([unit, unitTargets]) => {
                  const bgColor = 
                    unit === 'AISP 10' ? 'bg-blue-600' :
                    unit === 'AISP 28' ? 'bg-orange-600' :
                    unit === 'AISP 33' ? 'bg-green-600' :
                    unit === 'AISP 37' ? 'bg-red-600' :
                    'bg-purple-600';

                  return (
                    <div key={unit} className={`${bgColor} rounded-lg shadow-lg p-6 text-white`}>
                      <h2 className="text-xl font-semibold mb-4 text-center">{unit}</h2>
                      <div className="space-y-4">
                        {unitTargets.map((target) => (
                          <div key={target.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img 
                                src={crimeIcons[target.crime_type]} 
                                alt={target.crime_type}
                                className="w-6 h-6"
                              />
                              <span className="capitalize">{target.crime_type}</span>
                            </div>
                            {editingTarget?.id === target.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  className="w-20 px-2 py-1 text-gray-900 border rounded"
                                  value={editingTarget.target_value}
                                  onChange={(e) => setEditingTarget({
                                    ...editingTarget,
                                    target_value: parseInt(e.target.value) || 0
                                  })}
                                  min="0"
                                />
                                <button
                                  className="p-1 bg-green-500 rounded hover:bg-green-600"
                                  onClick={() => updateTarget(editingTarget)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button
                                  className="p-1 bg-gray-500 rounded hover:bg-gray-600"
                                  onClick={() => setEditingTarget(null)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{target.target_value}</span>
                                <button
                                  className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
                                  onClick={() => setEditingTarget(target)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
