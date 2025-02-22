-- Função para inicializar a estrutura da tabela targets
CREATE OR REPLACE FUNCTION initialize_targets_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar sequence se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'targets_id_seq') THEN
        CREATE SEQUENCE targets_id_seq;
    END IF;

    -- Adicionar coluna ID se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'targets' AND column_name = 'id') THEN
        ALTER TABLE targets ADD COLUMN id INTEGER DEFAULT nextval('targets_id_seq');
        ALTER TABLE targets ALTER COLUMN id SET NOT NULL;
        ALTER TABLE targets ADD PRIMARY KEY (id);
    END IF;

    -- Garantir que a coluna semester existe e tem as constraints corretas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'targets' AND column_name = 'semester') THEN
        ALTER TABLE targets ADD COLUMN semester INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE targets ADD CONSTRAINT semester_range CHECK (semester IN (1, 2));
    END IF;

    -- Criar índice para semester se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'targets' AND indexname = 'idx_targets_semester') THEN
        CREATE INDEX idx_targets_semester ON targets(semester);
    END IF;

    -- Garantir constraint unique
    ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_unit_year_semester_crime_type_key;
    ALTER TABLE targets ADD CONSTRAINT targets_unit_year_semester_crime_type_key 
        UNIQUE (unit, year, semester, crime_type);
END;
$$;