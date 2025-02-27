import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import { EditableTargetValue } from '../components/EditableTargetValue';
import { DeleteButton } from '../components/DeleteButton';
import { Target, targetService } from '../services/targetService';

export function Targets() {
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

  const risps = ['RISP 1', 'RISP 2', 'RISP 3', 'RISP 4', 'RISP 5', 'RISP 6', 'RISP 7'];

  // Mapeamento dos ícones por tipo de crime
  const crimeIcons: Record<string, string> = {
    'letalidade violenta': '/images/icons/letalidade.svg',
    'roubo de veículo': '/images/icons/rouboveiculo.svg',
    'roubo de rua': '/images/icons/rouborua.svg',
    'roubo de carga': '/images/icons/roubocarga.svg'
  };

  // Função para ordenar os alvos por RISP e tipo de crime
  const sortTargets = (targets: Target[]) => {
    return targets.sort((a, b) => {
      // Coloca RISP 5 primeiro
      if (a.unit === 'RISP 5' && b.unit !== 'RISP 5') return -1;
      if (a.unit !== 'RISP 5' && b.unit === 'RISP 5') return 1;
      
      // Depois ordena por unidade
      if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
      
      // Por fim, ordena por tipo de crime
      return crimeTypes.indexOf(a.crime_type) - crimeTypes.indexOf(b.crime_type);
    });
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleError = async (error: any, retryFn: () => Promise<void>) => {
    if (error.message?.includes('null value in column "id"')) {
      // Se for erro de ID nulo, tenta recarregar os dados
      toast.loading('Recarregando dados...');
      try {
        await retryFn();
      } catch (retryError: any) {
        toast.error(`Erro ao recarregar dados: ${retryError.message}`);
        setError(retryError.message);
      }
    } else {
      toast.error(`Erro: ${error.message}`);
      setError(error.message);
    }
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Criar as metas iniciais para todas as RISPs e tipos de crime
      const initialTargets = risps.flatMap(risp => 
        crimeTypes.map(crimeType => ({
          unit: risp,
          risp: risp, // Adicionando o campo risp
          year: 2025,
          semester: 1,
          crime_type: crimeType,
          target_value: 0
        }))
      );

      // Tentar até 3 vezes se houver erro de ID
      let attempts = 0;
      while (attempts < 3) {
        try {
          // Buscar metas existentes
          const { data: existingTargets, error } = await supabase
            .from('targets')
            .select('*')
            .eq('year', 2025)
            .eq('semester', 1);

          if (error) throw error;

          // Mesclar metas existentes com as iniciais
          const mergedTargets = initialTargets.map(target => {
            const existing = existingTargets?.find(e => 
              e.unit === target.unit && 
              e.crime_type === target.crime_type
            );
            return existing || target;
          });

          // Garantir que todas as metas existam no banco
          await targetService.ensureTargetsExist(mergedTargets);
          
          // Recarregar para obter os IDs atualizados
          const { data: finalTargets, error: finalError } = await supabase
            .from('targets')
            .select('*')
            .eq('year', 2025)
            .eq('semester', 1)
            .order('unit');

          if (finalError) throw finalError;

          setTargets(sortTargets(finalTargets || []));
          break; // Sai do loop se tudo der certo
        } catch (error: any) {
          if (!error.message?.includes('null value in column "id"') || attempts === 2) {
            throw error; // Re-lança o erro se não for relacionado a ID ou se for a última tentativa
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo entre tentativas
        }
      }
    } catch (error: any) {
      await handleError(error, fetchTargets);
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = async (target: Target) => {
    try {
      setLoading(true);
      setError(null);
      
      if (target.id) {
        // Atualiza meta existente
        const { error: updateError } = await supabase
          .from('targets')
          .update({ 
            target_value: target.target_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', target.id);

        if (updateError) throw updateError;
      } else {
        // Cria nova meta
        const { error: insertError } = await supabase
          .from('targets')
          .insert({
            ...target,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      toast.success('Meta atualizada com sucesso!');
      await fetchTargets(); // Recarrega os dados
      setEditingTarget(null);
    } catch (error: any) {
      setError(error.message);
      toast.error(`Erro ao atualizar a meta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearUnitTargets = async (unit: string) => {
    const toastId = toast.loading(`Limpando metas da ${unit}...`);
    try {
      setLoading(true);
      await targetService.clearTargetsByUnit(unit, 2025, 1);
      
      toast.success(
        <div>
          <p>Metas da {unit} limpas com sucesso!</p>
          <button
            onClick={async () => {
              try {
                await targetService.undoClearTargets(unit);
                await fetchTargets();
                toast.success(`Metas da ${unit} restauradas com sucesso!`);
              } catch (error: any) {
                toast.error(`Erro ao restaurar metas: ${error.message}`);
              }
            }}
            className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Desfazer
          </button>
        </div>,
        {
          id: toastId,
          duration: 5000, // 5 segundos para permitir que o usuário veja o botão de desfazer
        }
      );
      
      await fetchTargets(); // Recarrega os dados
    } catch (error: any) {
      toast.error(`Erro ao limpar metas da ${unit}: ${error.message}`, { id: toastId });
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
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card do Título */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center">
              <div className="w-[104px]"> {/* Container fixo para o botão */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
              </div>
              <h1 className="flex-1 text-4xl font-bold text-gray-900 text-center">
                METAS 1º SEMESTRE - 2025
              </h1>
              <div className="w-[104px]"></div> {/* Espaçador para manter simetria */}
            </div>
          </div>
        </div>

        {/* RISP 5 Principal */}
        {targetsByUnit['RISP 5'] && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-center flex items-center gap-2">
                  <img src="/images/logos/5cpa.png" alt="5º CPA" className="h-8" />
                  RISP 5
                </h2>
                <DeleteButton onClick={() => clearUnitTargets('RISP 5')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {targetsByUnit['RISP 5'].map((target) => (
                  <div key={target.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-600 p-2 rounded-lg">
                          <img 
                            src={crimeIcons[target.crime_type]} 
                            alt={target.crime_type}
                            className="w-6 h-6"
                          />
                        </div>
                        <span className="capitalize text-lg">{target.crime_type}</span>
                      </div>
                      <EditableTargetValue
                        target={target}
                        isEditing={editingTarget?.id === target.id}
                        onStartEdit={() => setEditingTarget(target)}
                        onSave={updateTarget}
                        onCancel={() => setEditingTarget(null)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Outras RISPs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(targetsByUnit)
            .filter(([unit]) => unit.startsWith('RISP') && unit !== 'RISP 5')
            .map(([unit, unitTargets]) => (
              <div key={unit} className="bg-gray-800 rounded-lg shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{unit}</h2>
                  <DeleteButton onClick={() => clearUnitTargets(unit)} size="small" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {unitTargets.map((target) => (
                    <div key={target.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-600 p-2 rounded-lg">
                            <img 
                              src={crimeIcons[target.crime_type]} 
                              alt={target.crime_type}
                              className="w-5 h-5"
                            />
                          </div>
                          <span className="capitalize text-sm">{target.crime_type}</span>
                        </div>
                        <EditableTargetValue
                          target={target}
                          isEditing={editingTarget?.id === target.id}
                          onStartEdit={() => setEditingTarget(target)}
                          onSave={updateTarget}
                          onCancel={() => setEditingTarget(null)}
                          size="small"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
