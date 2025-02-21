import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Toaster, toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import { FiUpload, FiTrash2, FiSettings } from 'react-icons/fi';

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

export function Targets() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const crimeTypes = [
    'letalidade violenta',
    'roubo de veículo',
    'roubo de rua',
    'roubo de carga'
  ];

  const units = [
    { type: 'AISP', numbers: ['10', '28', '33', '37', '43'] },
    { type: 'RISP', numbers: ['1', '2', '3', '4', '5', '6', '7'] }
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
      
      const { error: updateError } = await supabase
        .from('targets')
        .update({ 
          target_value: target.target_value,
          updated_at: new Date().toISOString()
        })
        .eq('id', target.id);

      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }

      const { data: updatedData, error: selectError } = await supabase
        .from('targets')
        .select('*')
        .eq('id', target.id)
        .single();

      if (selectError) {
        setError(selectError.message);
        throw selectError;
      }

      if (updatedData) {
        setTargets(prevTargets => 
          prevTargets.map(t => t.id === target.id ? updatedData : t)
        );
        setEditingTarget(null);
        toast.success('Meta atualizada com sucesso!');
      } else {
        throw new Error('Registro não encontrado após atualização');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Erro ao atualizar a meta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportXLSX = async () => {
    // Implementar lógica de importação
    toast.success('Funcionalidade em desenvolvimento');
  };

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      try {
        await supabase.from('targets').delete().neq('id', 0);
        toast.success('Dados limpos com sucesso!');
        window.location.reload();
      } catch (error) {
        toast.error('Erro ao limpar dados');
      }
    }
  };

  const handleConfigureTargets = () => {
    // Implementar lógica de configuração
    toast.success('Funcionalidade em desenvolvimento');
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
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header com botão voltar */}
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-900 transition-colors flex items-center"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Configurar Metas</h1>
            </div>

            {/* Botões de Ação */}
            {user?.user_metadata?.role === 'admin' && (
              <div className="flex gap-4">
                <button
                  onClick={handleImportXLSX}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiUpload className="w-5 h-5" />
                  Importar XLSX
                </button>
                <button
                  onClick={handleClearData}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FiTrash2 className="w-5 h-5" />
                  Limpar Dados
                </button>
                <button
                  onClick={handleConfigureTargets}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FiSettings className="w-5 h-5" />
                  Configurar Metas
                </button>
              </div>
            )}
          </div>

          {/* Título do Semestre */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Metas 1º Semestre de 2025
            </h2>
          </div>

          {/* RISP Cards */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            {/* RISP 5 Card */}
            <div className="mb-8">
              {Object.entries(targetsByUnit)
                .filter(([unit]) => unit === 'RISP 5')
                .map(([unit, unitTargets]) => (
                  <div key={unit} className="bg-gray-800 rounded-lg shadow-lg p-6 text-white w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center">{unit}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {unitTargets.map((target) => (
                        <div key={target.id} className="bg-gray-700 rounded-lg p-4 shadow-md">
                          <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="bg-gray-600 p-2 rounded-lg">
                                  <img 
                                    src={crimeIcons[target.crime_type]} 
                                    alt={target.crime_type}
                                    className="w-6 h-6"
                                  />
                                </div>
                                <span className="capitalize text-lg font-medium">{target.crime_type}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-600 pt-4">
                              {editingTarget?.id === target.id ? (
                                <div className="flex items-center gap-2 w-full">
                                  <input
                                    type="number"
                                    className="w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={editingTarget.target_value}
                                    onChange={(e) => setEditingTarget({
                                      ...editingTarget,
                                      target_value: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                  />
                                  <button
                                    className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                                    onClick={() => updateTarget(editingTarget)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    className="p-2 bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
                                    onClick={() => setEditingTarget(null)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-2xl font-bold">{target.target_value}</span>
                                  <button
                                    className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                                    onClick={() => setEditingTarget(target)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Other RISPs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(targetsByUnit)
                .filter(([unit]) => unit.startsWith('RISP') && unit !== 'RISP 5')
                .sort(([unitA], [unitB]) => {
                  const numberA = parseInt(unitA.split(' ')[1]);
                  const numberB = parseInt(unitB.split(' ')[1]);
                  return numberA - numberB;
                })
                .map(([unit, unitTargets]) => (
                  <div key={unit} className="bg-gray-800/90 rounded-lg shadow-lg p-4 text-white">
                    <h2 className="text-xl font-bold mb-4 text-center">{unit}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {unitTargets.map((target) => (
                        <div key={target.id} className="bg-gray-700 rounded-lg p-3 shadow-md">
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-gray-600 p-1.5 rounded-lg">
                                <img 
                                  src={crimeIcons[target.crime_type]} 
                                  alt={target.crime_type}
                                  className="w-5 h-5"
                                />
                              </div>
                              <span className="capitalize text-sm font-medium">{target.crime_type}</span>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-600 pt-2">
                              {editingTarget?.id === target.id ? (
                                <div className="flex items-center gap-1 w-full">
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 text-gray-900 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={editingTarget.target_value}
                                    onChange={(e) => setEditingTarget({
                                      ...editingTarget,
                                      target_value: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                  />
                                  <button
                                    className="p-1 bg-green-500 rounded hover:bg-green-600 transition-colors"
                                    onClick={() => updateTarget(editingTarget)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    className="p-1 bg-gray-500 rounded hover:bg-gray-600 transition-colors"
                                    onClick={() => setEditingTarget(null)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-lg font-bold">{target.target_value}</span>
                                  <button
                                    className="p-1 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                                    onClick={() => setEditingTarget(target)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* AISP Cards */}
          <div className="bg-gray-50 rounded-lg p-6">
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
}
