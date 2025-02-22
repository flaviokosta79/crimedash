-- Adiciona coluna month na tabela targets
ALTER TABLE targets ADD COLUMN month INTEGER NOT NULL DEFAULT 1;

-- Adiciona constraint para validar o mês entre 1 e 12
ALTER TABLE targets ADD CONSTRAINT month_range CHECK (month >= 1 AND month <= 12);

-- Adiciona índice para melhorar performance de consultas por mês
CREATE INDEX idx_targets_month ON targets(month);

-- Atualiza a constraint unique para incluir o mês
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_unit_year_semester_crime_type_key;
ALTER TABLE targets ADD CONSTRAINT targets_unit_year_month_crime_type_key UNIQUE (unit, year, month, crime_type);