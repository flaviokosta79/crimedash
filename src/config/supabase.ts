import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase');
}

// Criar uma única instância do cliente regular
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Criar uma única instância do cliente admin com configurações otimizadas
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: sessionStorage, // Use sessionStorage instead of localStorage for admin
    storageKey: 'supabase-admin-auth' // Unique storage key for admin client
  }
});

// Exportar cliente padrão
export const supabase = supabaseClient;

// Exportar cliente admin
export const getSupabaseAdmin = () => supabaseAdminClient;
