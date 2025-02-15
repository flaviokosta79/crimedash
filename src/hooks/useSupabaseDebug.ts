import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';

interface DebugInfo {
  session: any;
  jwt: string | null;
  role: string | null;
  userId: string | null;
  error: string | null;
  lastRequest: {
    method: string;
    table: string;
    error: any;
  } | null;
}

export function useSupabaseDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    session: null,
    jwt: null,
    role: null,
    userId: null,
    error: null,
    lastRequest: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar sessão
        const { data: { session } } = await supabase.auth.getSession();
        
        // Extrair informações do JWT
        const jwt = session?.access_token || null;
        let role = null;
        let userId = null;

        if (jwt) {
          try {
            const [, payload] = jwt.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            role = decodedPayload.role;
            userId = decodedPayload.sub;
          } catch (e) {
            console.error('Erro ao decodificar JWT:', e);
          }
        }

        setDebugInfo(prev => ({
          ...prev,
          session,
          jwt,
          role,
          userId
        }));

        // Testar acesso às tabelas
        const tables = ['crimes', 'crime_timeseries', 'targets'];
        
        for (const table of tables) {
          try {
            console.log(`Testando acesso à tabela ${table}...`);
            
            // Teste com cliente normal
            console.log('Cliente normal:');
            const { data: normalData, error: normalError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            console.log(`- Resultado: ${normalError ? 'Erro' : 'Sucesso'}`);
            if (normalError) console.error(`- Erro: ${normalError.message}`);
            
            // Teste com cliente admin
            console.log('Cliente admin:');
            const { data: adminData, error: adminError } = await supabaseAdmin
              .from(table)
              .select('*')
              .limit(1);
            
            console.log(`- Resultado: ${adminError ? 'Erro' : 'Sucesso'}`);
            if (adminError) console.error(`- Erro: ${adminError.message}`);

          } catch (error: any) {
            console.error(`Erro ao testar tabela ${table}:`, error);
            setDebugInfo(prev => ({
              ...prev,
              error: error.message,
              lastRequest: {
                method: 'SELECT',
                table,
                error
              }
            }));
          }
        }

      } catch (error: any) {
        console.error('Erro ao verificar autenticação:', error);
        setDebugInfo(prev => ({
          ...prev,
          error: error.message
        }));
      }
    };

    checkAuth();
  }, []);

  return debugInfo;
}
