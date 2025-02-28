import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase');
}

// Função para verificar o modo de ambiente (sempre consultará localStorage)
export const isDevelopmentMode = (): boolean => {
  try {
    // Verificar primeiro no localStorage
    const localStorageEnv = localStorage.getItem('app_environment');
    if (localStorageEnv !== null) {
      console.log('🔄 Ambiente definido no localStorage:', localStorageEnv);
      return localStorageEnv === 'development';
    }
    
    // Se não existir no localStorage, usar a variável de ambiente
    const envMode = import.meta.env.VITE_APP_ENV === 'development';
    console.log('🔄 Ambiente definido por variável de ambiente:', envMode ? 'development' : 'production');
    return envMode;
  } catch (e) {
    console.warn('Erro ao acessar localStorage:', e);
    return false;
  }
};

// Função para obter o nome correto da tabela (avaliada a cada chamada)
export const getTableName = (tableKey: 'CRIMES' | 'TARGETS' | 'TIMESERIES' | 'HISTORY'): string => {
  const isDev = isDevelopmentMode();
  let tableName;
  
  switch(tableKey) {
    case 'CRIMES':
      tableName = isDev ? 'crimes2_test' : 'crimes2';
      break;
    case 'TARGETS':
      tableName = isDev ? 'targets_test' : 'targets';
      break;
    case 'TIMESERIES':
      tableName = isDev ? 'crime_timeseries_test' : 'crime_timeseries';
      break;
    case 'HISTORY':
      tableName = isDev ? 'history_test' : 'history';
      break;
  }
  
  console.log(`🔄 Ambiente: ${isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'} | Usando tabela: ${tableName}`);
  return tableName;
};

// Criar uma única instância do cliente regular
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth-token' // Chave explícita para o cliente normal
  }
});

// Cliente admin criado sob demanda para evitar inicializações desnecessárias
let supabaseAdminClient: SupabaseClient | null = null;

// Exportar cliente padrão
export const supabase = supabaseClient;

// Exportar função que retorna cliente admin (lazy-loading)
export const getSupabaseAdmin = () => {
  // Só cria a instância quando for necessário
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false, // Não persiste a sessão para evitar conflitos
        autoRefreshToken: false, // Não é necessário para o admin client
        storage: sessionStorage, // Usa sessionStorage em vez de localStorage
        storageKey: 'supabase-admin-auth-token' // Chave explicitamente diferente
      }
    });
  }
  
  return supabaseAdminClient;
};
