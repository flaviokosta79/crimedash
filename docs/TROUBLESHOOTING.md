# Guia de Solução de Problemas - CrimeDash

Este documento contém soluções para problemas comuns encontrados no CrimeDash.

## Problemas de Autenticação

### Erro: "permission denied for table crimes"

**Sintoma:**
- Erro de permissão ao tentar acessar as tabelas do Supabase
- Mensagem "permission denied for table crimes" no console

**Solução:**
1. Verifique se as políticas RLS estão configuradas corretamente:
```sql
-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON crimes;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON crimes;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON crimes;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON crimes;

-- Habilitar RLS
ALTER TABLE crimes ENABLE ROW LEVEL SECURITY;

-- Criar nova política
CREATE POLICY "Permitir todas as operações para usuários autenticados"
ON crimes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir permissões
GRANT ALL ON crimes TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

2. Verifique se o cliente Supabase está configurado com as chaves corretas:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cliente para usuários normais
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Cliente com service role para operações administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
```

3. Use o componente de debug para verificar a autenticação:
```typescript
import { useSupabaseDebug } from '../hooks/useSupabaseDebug';

export function SupabaseDebug() {
  const debugInfo = useSupabaseDebug();
  // ...
}
```

### Erro: "JWT token is invalid"

**Sintoma:**
- Erro de token inválido
- Usuário é redirecionado para a página de login

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

2. Limpe o localStorage e faça login novamente:
```javascript
localStorage.clear();
window.location.href = '/login';
```

## Problemas de Dados

### Erro: "Dados não aparecem no gráfico"

**Sintoma:**
- Gráfico vazio
- Dados não são carregados

**Solução:**
1. Verifique se há dados no período selecionado:
```sql
SELECT * FROM crimes 
WHERE data_fato >= '2025-01-01' 
AND data_fato <= '2025-12-31';
```

2. Verifique se o processamento dos dados está correto:
```typescript
const processGraphData = (crimes: any[]) => {
  // Criar mapa de datas
  const dateMap: Record<string, any> = {};
  // ...
  return Object.values(dateMap);
};
```

## Problemas de Performance

### Erro: "Carregamento lento dos dados"

**Sintoma:**
- Dashboard demora para carregar
- Gráficos demoram para atualizar

**Solução:**
1. Use o cliente supabaseAdmin para operações de leitura:
```typescript
const { data: crimes, error } = await supabaseAdmin
  .from('crimes')
  .select('*')
  .order('data_fato', { ascending: true });
```

2. Implemente paginação:
```typescript
const { data, error } = await supabase
  .from('crimes')
  .select('*')
  .range(0, 49)  // 50 registros por página
  .order('data_fato', { ascending: false });
```

## Ferramentas de Debug

### Componente SupabaseDebug

O componente `SupabaseDebug` mostra:
- Status da autenticação
- ID do usuário
- Role do usuário
- JWT Token
- Erros de acesso

Para usar:
1. Adicione ao App.tsx:
```typescript
import { SupabaseDebug } from './components/SupabaseDebug';

function App() {
  return (
    <>
      {/* ... */}
      <SupabaseDebug />
    </>
  );
}
```

2. Verifique o console do navegador (F12) para logs detalhados de acesso às tabelas.

## Contato e Suporte

Se você encontrar um problema não listado aqui:
1. Verifique os logs no console do navegador
2. Use o componente SupabaseDebug para diagnóstico
3. Abra uma issue no GitHub com:
   - Descrição do problema
   - Logs de erro
   - Saída do SupabaseDebug
   - Passos para reproduzir

## Problemas Resolvidos

### 1. Scroll Reset no Gráfico do Dashboard

**Problema:**
- Ao mudar o período do gráfico no Dashboard, a página voltava para o topo
- Causava uma experiência ruim para o usuário que precisava rolar a página novamente
- Acontecia um "flash" de loading que causava re-renderização completa

**Causa:**
- O componente estava usando um único estado (`data`) para todos os dados
- Quando o período mudava, todos os dados eram recarregados
- O estado de loading causava re-renderização completa da página

**Solução:**
1. Separamos os dados em dois estados:
   ```typescript
   const [cardData, setCardData] = useState<Record<string, any>>({});
   const [graphData, setGraphData] = useState<any[]>([]);
   ```

2. Criamos duas funções separadas:
   - `fetchCardData`: carrega dados dos cards (chamada apenas no início)
   - `fetchGraphData`: carrega dados do gráfico (chamada quando período muda)

3. Removemos o loading state do `fetchGraphData`:
   ```typescript
   const fetchGraphData = async () => {
     try {
       // Não setamos loading aqui para evitar o flash da tela
       setError(null);
       // ... resto do código
     }
   };
   ```

4. Mantivemos o loading apenas no carregamento inicial:
   ```typescript
   const fetchCardData = async () => {
     try {
       setLoading(true);
       // ... resto do código
     } finally {
       setLoading(false);
     }
   };
   ```

**Resultado:**
- A página mantém a posição do scroll ao mudar o período
- Não há mais "flash" de loading
- Melhor experiência do usuário ao interagir com o gráfico

**Aprendizados:**
1. Separar estados quando componentes têm partes independentes
2. Evitar re-renderizações desnecessárias
3. Usar loading states apenas quando necessário
4. Considerar a experiência do usuário ao implementar atualizações de dados
