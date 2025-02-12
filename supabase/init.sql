-- Criar tabela de crimes
CREATE TABLE IF NOT EXISTS crimes (
  id BIGSERIAL PRIMARY KEY,
  seq INTEGER,                    -- Coluna A: Número sequencial
  seq_bo INTEGER,                -- Coluna B: Número do BO
  ano_bo INTEGER,               -- Coluna C: Ano do BO
  data_fato DATE,               -- Coluna D: Data da ocorrência
  hora_fato TIME,               -- Coluna E: Hora da ocorrência
  data_comunicacao DATE,        -- Coluna F: Data da comunicação
  titulo_do_delito VARCHAR(255), -- Coluna G: Título do delito
  tipo_do_delito VARCHAR(255),   -- Coluna H: Tipo do delito
  indicador_estrategico VARCHAR(255), -- Coluna I: Indicador estratégico
  fase_divulgacao VARCHAR(50),   -- Coluna J: Fase de divulgação
  dia_semana VARCHAR(50),        -- Coluna K: Dia da semana
  aisp VARCHAR(50),              -- Coluna L: AISP
  risp VARCHAR(50),              -- Coluna M: RISP
  municipio VARCHAR(255),        -- Coluna N: Município
  bairro VARCHAR(255),           -- Coluna O: Bairro
  faixa_horario VARCHAR(50),     -- Coluna P: Faixa de horário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de série temporal
CREATE TABLE IF NOT EXISTS crime_timeseries (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  unit VARCHAR(50) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_crimes_data_fato ON crimes(data_fato);
CREATE INDEX IF NOT EXISTS idx_crimes_aisp ON crimes(aisp);
CREATE INDEX IF NOT EXISTS idx_crimes_tipo_delito ON crimes(tipo_do_delito);
CREATE INDEX IF NOT EXISTS idx_crimes_indicador ON crimes(indicador_estrategico);
CREATE INDEX IF NOT EXISTS idx_crimes_municipio ON crimes(municipio);
CREATE INDEX IF NOT EXISTS idx_crimes_bairro ON crimes(bairro);
CREATE INDEX IF NOT EXISTS idx_timeseries_date ON crime_timeseries(date);
CREATE INDEX IF NOT EXISTS idx_timeseries_unit ON crime_timeseries(unit);

-- Criar view materializada para totais por unidade
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_unit_totals AS
SELECT 
  aisp as unit,
  COUNT(*) as total_occurrences,
  COUNT(CASE WHEN tipo_do_delito = 'Letalidade violenta' THEN 1 END) as lethal_violence,
  COUNT(CASE WHEN tipo_do_delito = 'Roubo de rua' THEN 1 END) as street_robbery,
  COUNT(CASE WHEN tipo_do_delito = 'Roubo de veículo' THEN 1 END) as vehicle_robbery,
  COUNT(CASE WHEN tipo_do_delito = 'Roubo de carga' THEN 1 END) as cargo_robbery,
  DATE_TRUNC('month', data_fato) as month
FROM crimes
GROUP BY aisp, DATE_TRUNC('month', data_fato)
WITH DATA;

-- Criar índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_unit_totals ON mv_unit_totals(unit, month);

-- Criar função para atualizar a view materializada
CREATE OR REPLACE FUNCTION refresh_mv_unit_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unit_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar a view materializada
CREATE TRIGGER trigger_refresh_mv_unit_totals
AFTER INSERT OR UPDATE OR DELETE ON crimes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_mv_unit_totals();
