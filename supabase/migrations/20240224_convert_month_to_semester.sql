-- Adiciona coluna semester temporária
ALTER TABLE targets ADD COLUMN semester INTEGER;

-- Converte os meses para semestres (1-6 = semestre 1, 7-12 = semestre 2)
UPDATE targets SET semester = CASE 
  WHEN month <= 6 THEN 1 
  ELSE 2 
END;

-- Remove a coluna month e seus índices/constraints
DROP INDEX IF EXISTS idx_targets_month;
ALTER TABLE targets DROP CONSTRAINT IF EXISTS month_range;
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_unit_year_month_crime_type_key;
ALTER TABLE targets DROP COLUMN month;

-- Torna semester NOT NULL e adiciona constraint
ALTER TABLE targets ALTER COLUMN semester SET NOT NULL;
ALTER TABLE targets ADD CONSTRAINT semester_range CHECK (semester IN (1, 2));

-- Adiciona índice para semester
CREATE INDEX idx_targets_semester ON targets(semester);

-- Cria nova constraint unique
ALTER TABLE targets ADD CONSTRAINT targets_unit_year_semester_crime_type_key 
  UNIQUE (unit, year, semester, crime_type);