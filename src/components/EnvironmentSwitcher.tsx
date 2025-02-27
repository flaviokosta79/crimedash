import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { isDevelopmentMode, supabase } from '../config/supabase';
import { FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const ENV_STORAGE_KEY = 'app_environment';

// Versão simplificada do componente para ser usado no Dashboard
export const EnvironmentSwitcherButton: React.FC<{ 
  isAdmin: boolean 
}> = ({ isAdmin }) => {
  const [isDev, setIsDev] = useState<boolean>(() => {
    const savedEnv = localStorage.getItem(ENV_STORAGE_KEY);
    return savedEnv === 'development';
  });

  const toggleEnvironment = () => {
    if (!isAdmin) return;

    const newEnv = !isDev;
    setIsDev(newEnv);
    
    // Salvar a configuração no localStorage
    localStorage.setItem(ENV_STORAGE_KEY, newEnv ? 'development' : 'production');
    
    // Notificar o usuário da mudança
    toast.success(
      `Ambiente alterado para ${newEnv ? 'Desenvolvimento' : 'Produção'}. ` +
      'Recarregando página...'
    );
    
    // Recarregar a página para aplicar as alterações
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <button
      onClick={toggleEnvironment}
      className={`flex flex-col items-center justify-center p-6 border rounded-lg shadow-lg transition-colors w-full h-full ${
        isDev 
          ? 'bg-amber-100 border-amber-300 hover:bg-amber-200' 
          : 'bg-blue-100 border-blue-300 hover:bg-blue-200'
      }`}
    >
      <div className="text-4xl mb-3">
        {isDev ? <FiToggleRight className="text-amber-600" /> : <FiToggleLeft className="text-blue-600" />}
      </div>
      <div className="text-lg font-semibold mb-1">
        {isDev ? 'Modo Desenvolvimento' : 'Modo Produção'}
      </div>
      <p className="text-sm text-gray-600">
        {isDev ? 'Usando tabelas de teste' : 'Usando tabelas de produção'}
      </p>
      <div className="mt-2 text-xs text-gray-500">
        Clique para alternar
      </div>
    </button>
  );
};

// Versão original para uso como componente fixo (mantida para compatibilidade)
const EnvironmentSwitcher: React.FC = () => {
  const [isDev, setIsDev] = useState<boolean>(() => {
    const savedEnv = localStorage.getItem(ENV_STORAGE_KEY);
    return savedEnv === 'development';
  });
  const { isAdmin, loading } = useIsAdmin();

  // Log para debug
  useEffect(() => {
    console.log('EnvironmentSwitcher: Estado atual -', { isAdmin, loading });
  }, [isAdmin, loading]);

  const toggleEnvironment = () => {
    const newEnv = !isDev;
    setIsDev(newEnv);
    
    // Salvar a configuração no localStorage
    localStorage.setItem(ENV_STORAGE_KEY, newEnv ? 'development' : 'production');
    
    // Notificar o usuário da mudança
    toast.success(
      `Ambiente alterado para ${newEnv ? 'Desenvolvimento' : 'Produção'}. ` +
      'Recarregando página...'
    );
    
    // Recarregar a página para aplicar as alterações
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Forçar visualização para debug (remova depois)
  const forceShow = false;

  // Se não for admin (e não estiver forçando visualização para debug), não renderiza o componente
  if (!isAdmin && !forceShow) {
    console.log('EnvironmentSwitcher: Usuário não é admin, não renderizando');
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            Ambiente: {isDev ? 'Desenvolvimento' : 'Produção'}
          </span>
          <button
            onClick={toggleEnvironment}
            className={`px-3 py-1 rounded-md text-white ${
              isDev ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Alternar para {isDev ? 'Produção' : 'Desenvolvimento'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isDev ? 'Usando tabelas *_test' : 'Usando tabelas padrão'}
        </div>
      </div>
    </div>
  );
};

// Função para verificar se o usuário tem permissão de administrador
const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Pega o usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        console.log('EnvironmentSwitcher: Verificando usuário', user?.email);
        
        if (user) {
          // Primeiro, tente verificar pelo email (abordagem direta)
          // Coloque aqui os emails dos administradores do sistema
          const adminEmails = [
            'flaviobrito@pm.rj.gov.br',  // Substitua pelos emails reais dos administradores
            'outro@administrador.com'
          ];
          
          if (adminEmails.includes(user.email || '')) {
            console.log('EnvironmentSwitcher: Usuário é admin por email');
            setIsAdmin(true);
            setLoading(false);
            return;
          }

          // Verificar na tabela users
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.log('EnvironmentSwitcher: Erro ao buscar na tabela users:', userError.message);
            
            // Como alternativa, verificar nos metadados do usuário
            if (user.user_metadata && user.user_metadata.role === 'admin') {
              console.log('EnvironmentSwitcher: Usuário é admin por metadata');
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } else {
            console.log('EnvironmentSwitcher: Encontrado na tabela users, role:', userProfile?.role);
            setIsAdmin(userProfile?.role === 'admin');
          }
        } else {
          console.log('EnvironmentSwitcher: Nenhum usuário logado');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('EnvironmentSwitcher: Erro ao verificar permissões:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  return { isAdmin, loading };
};

export default EnvironmentSwitcher;