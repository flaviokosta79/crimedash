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

### Erro: "Metas zeradas nos cards"

**Sintoma:**
- As metas aparecem como 0 em todos os cards do Dashboard
- Os dados existem no banco de dados mas não são exibidos corretamente

**Problema:**
O código estava tentando acessar a propriedade `value` dos registros da tabela `targets`, mas o nome correto da coluna no banco de dados é `target_value`. 

Estrutura da tabela `targets`:
```sql
"id", "unit", "crime_type", "target_value", "year", "semester", "created_at", "updated_at"

```

**Solução:**
Corrigir o processamento das metas no arquivo `Dashboard.tsx`:
```typescript
const targetsByUnit: Record<string, Record<string, number>> = {};
targetsData?.forEach((target) => {
  if (!targetsByUnit[target.unit]) {
    targetsByUnit[target.unit] = {};
  }
  // Corrigido de target.value para target.target_value
  targetsByUnit[target.unit][target.crime_type] = target.target_value;
});
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

### 2. Erro: "Gráfico não exibe dados corretamente"

**Sintoma:**
- Gráfico não mostra as linhas
- Cores das AISPs não aparecem corretamente
- Datas aparecem erradas no tooltip
- Dias sem ocorrências são pulados

**Problema:**
1. A estrutura dos dados estava incorreta para o Recharts
2. As cores estavam misturadas entre Tailwind e hexadecimal
3. O fuso horário das datas não estava ajustado
4. Dias sem ocorrências não eram incluídos no dataset

**Solução:**

1. Separar as cores em mapas diferentes:
```typescript
const battalionColors: Record<PoliceUnit, string> = {
  'AISP 10': 'bg-blue-600',    // Para os cards
  'AISP 28': 'bg-orange-600',
  'AISP 33': 'bg-green-600',
  'AISP 37': 'bg-red-600',
  'AISP 43': 'bg-purple-600'
};

const graphColors: Record<PoliceUnit, string> = {
  'AISP 10': '#1f77b4',        // Para o gráfico
  'AISP 28': '#ff7f0e',
  'AISP 33': '#2ca02c',
  'AISP 37': '#d62728',
  'AISP 43': '#9467bd'
};

const textColors: Record<PoliceUnit, string> = {
  'AISP 10': 'text-blue-600',  // Para o tooltip
  'AISP 28': 'text-orange-600',
  'AISP 33': 'text-green-600',
  'AISP 37': 'text-red-600',
  'AISP 43': 'text-purple-600'
};
```

2. Corrigir a estrutura dos dados para o Recharts:
```typescript
const processTimeSeriesData = (data: any[]) => {
  const dateMap: { [key: string]: any } = {};
  
  // Inicializar todos os dias com zero
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dateMap[dateStr] = {
      date: dateStr,
      'AISP 10': 0,
      'AISP 28': 0,
      'AISP 33': 0,
      'AISP 37': 0,
      'AISP 43': 0
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Preencher com dados reais
  data.forEach((item) => {
    const date = item.data_fato.split('T')[0];
    if (dateMap[date]) {
      dateMap[date][item.aisp] = (dateMap[date][item.aisp] || 0) + 1;
    }
  });

  return Object.values(dateMap).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};
```

3. Ajustar o componente LineChart:
```typescript
<LineChart data={graphData}>
  <XAxis 
    dataKey="date" 
    tickFormatter={(date) => {
      const [year, month, day] = date.split('-');
      return `${day}/${month}`;
    }}
    angle={-45}
    textAnchor="end"
    height={60}
  />
  <YAxis />
  <Tooltip 
    content={({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const date = new Date(label);
        date.setHours(date.getHours() + 3); // Ajuste fuso horário
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        return (
          <div className="bg-white p-4 border border-gray-200 rounded shadow-lg min-w-[200px]">
            <div className="text-base font-bold text-gray-700 mb-2">{formattedDate}</div>
            {payload.map((pld, index) => {
              const textColor = textColors[pld.name as PoliceUnit] || 'text-gray-600';
              return (
                <div key={index} className="text-base mb-1 flex justify-between">
                  <span className={`font-medium ${textColor}`}>{pld.name}</span>
                  <span className="text-gray-600">{pld.value}</span>
                </div>
              );
            })}
          </div>
        );
      }
      return null;
    }}
  />
  {Object.keys(graphColors).map((battalion) => (
    <Line
      key={battalion}
      type="monotone"
      dataKey={battalion}
      name={battalion}
      stroke={graphColors[battalion as PoliceUnit]}
      activeDot={{ r: 8 }}
      strokeWidth={2}
    />
  ))}
</LineChart>
```

4. Melhorar a query do Supabase:
```typescript
const { data: crimeData, error: crimeError } = await supabase
  .from('crimes')
  .select('*')
  .gte('data_fato', startDate.toISOString())
  .lte('data_fato', endDate.toISOString())
  .order('data_fato', { ascending: true });
```

### estrutura da tabela crimes

```sql
"id", "seq", "seq_bo", "ano_bo", "data_fato", "hora_fato", "data_comunicacao", "titulo_do_delito", "tipo_do_delito", "indicador_estrategico", "fase_divulgacao", "dia_semana", "aisp", "risp", "municipio", "bairro", "faixa_horario", "created_at"
```

### Como é feita a consulta no banco de dados?


## No Dashboard:
## typescript
## CopyInsert
## const { data: allCrimes, error } = await supabaseAdmin
##  .from('crimes')
##  .select('*');
## Não tem filtro de data
## Usa supabaseAdmin em vez de supabase
## Busca todos os crimes de uma vez
## Vou corrigir o UnitDashboard para seguir a mesma lógica: