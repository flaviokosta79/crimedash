import { useSupabaseDebug } from '../hooks/useSupabaseDebug';

export function SupabaseDebug() {
  const debugInfo = useSupabaseDebug();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg max-w-lg overflow-auto max-h-[80vh] text-black">
      <h2 className="text-lg font-bold mb-4">Debug Supabase</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Status da Autenticação</h3>
          <p>Autenticado: {debugInfo.session ? 'Sim' : 'Não'}</p>
          <p>User ID: {debugInfo.userId || 'N/A'}</p>
          <p>Role: {debugInfo.role || 'N/A'}</p>
        </div>

        {debugInfo.error && (
          <div className="bg-red-50 p-4 rounded">
            <h3 className="font-semibold text-red-700">Erro</h3>
            <p className="text-red-600">{debugInfo.error}</p>
          </div>
        )}

        {debugInfo.lastRequest && (
          <div>
            <h3 className="font-semibold">Última Requisição</h3>
            <p>Método: {debugInfo.lastRequest.method}</p>
            <p>Tabela: {debugInfo.lastRequest.table}</p>
            {debugInfo.lastRequest.error && (
              <p className="text-red-600">
                Erro: {debugInfo.lastRequest.error.message}
              </p>
            )}
          </div>
        )}

        <div>
          <h3 className="font-semibold">JWT Token</h3>
          <div className="bg-gray-100 p-2 rounded overflow-auto">
            <pre className="text-xs whitespace-pre-wrap break-all">{debugInfo.jwt || 'N/A'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
