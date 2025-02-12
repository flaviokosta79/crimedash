-- Criar tabela de crimes
CREATE TABLE IF NOT EXISTS crimes (
    id SERIAL PRIMARY KEY,
    seq INTEGER,
    seq_bo INTEGER,
    ano_bo INTEGER,
    data_fato DATE,
    hora_fato TIME,
    data_comunicacao DATE,
    titulo_do_delito TEXT,
    tipo_do_delito TEXT,
    indicador_estrategico TEXT,
    fase_divulgacao TEXT,
    dia_semana TEXT,
    aisp TEXT,
    risp TEXT,
    municipio TEXT,
    bairro TEXT,
    faixa_horario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de série temporal
CREATE TABLE IF NOT EXISTS crime_timeseries (
    id SERIAL PRIMARY KEY,
    date DATE,
    unit TEXT,
    count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_crimes_aisp ON crimes(aisp);
CREATE INDEX IF NOT EXISTS idx_crimes_data_fato ON crimes(data_fato);
CREATE INDEX IF NOT EXISTS idx_timeseries_unit ON crime_timeseries(unit);
CREATE INDEX IF NOT EXISTS idx_timeseries_date ON crime_timeseries(date);
