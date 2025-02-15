# Componentes do CrimeDash

## Cards de Métricas (UnitDashboard)

### Layout e Estilo
```tsx
<div 
  className="p-6 rounded-lg shadow-lg h-48"
  style={{ 
    backgroundColor: CRIME_COLORS[tipoCrime] + '15',
    borderLeft: `4px solid ${CRIME_COLORS[tipoCrime]}`
  }}
>
```

#### Estrutura Visual
- Altura fixa: h-48
- Padding: p-6
- Borda arredondada: rounded-lg
- Sombra: shadow-lg
- Borda esquerda colorida com a cor do tipo de crime
- Fundo com cor do tipo de crime em 15% de opacidade

#### Organização do Conteúdo
```tsx
<div className="flex flex-col space-y-2">
  {/* Valor Atual */}
  <div>
    <p className="text-xs text-gray-600">Atual</p>
    <p className="text-3xl font-bold" style={{ color: CRIME_COLORS[tipoCrime] }}>
      {valor}
    </p>
  </div>
  
  {/* Meta e Diferença */}
  <div className="flex justify-between items-end">
    <div>
      <p className="text-xs text-gray-600">Meta</p>
      <p className="text-lg font-semibold text-gray-700">{meta}</p>
    </div>
    <div>
      <p className="text-xs text-gray-600">Diferença</p>
      <p className={`text-lg font-semibold ${diff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {diff <= 0 ? '' : '+'}{diff}
      </p>
    </div>
  </div>
</div>
```

#### Tipografia
- Título do Card: text-sm font-semibold text-gray-900
- Label (Atual/Meta/Diferença): text-xs text-gray-600
- Valor Atual: text-3xl font-bold (cor do tipo de crime)
- Meta: text-lg font-semibold text-gray-700
- Diferença: text-lg font-semibold (verde se <= 0, vermelho se > 0)

#### Lógica da Diferença
```typescript
const diff = (valorAtual || 0) - (meta || 0);
const colorClass = diff <= 0 ? 'text-green-600' : 'text-red-600';
const sign = diff <= 0 ? '' : '+';
```

- Verde (text-green-600): quando o valor atual é menor ou igual à meta
- Vermelho (text-red-600): quando o valor atual é maior que a meta
- Sinal de '+' apenas quando excede a meta

#### Cores dos Tipos de Crime
```typescript
const CRIME_COLORS = {
  'Letalidade Violenta': '#1f77b4',
  'Roubo de Veículo': '#ff7f0e',
  'Roubo de Rua': '#2ca02c',
  'Roubo de Carga': '#d62728'
};
```

### Responsividade
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
```
- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 4 colunas
- Gap entre cards: 4 (1rem)
- Margem inferior: 8 (2rem)
