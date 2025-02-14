# Troubleshooting Guide

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
