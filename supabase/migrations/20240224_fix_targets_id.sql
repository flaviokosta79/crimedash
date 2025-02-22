-- Verifica se a coluna id existe e tem a configuração correta
DO $$ 
BEGIN
    -- Adiciona a coluna id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'targets' AND column_name = 'id') THEN
        ALTER TABLE targets ADD COLUMN id SERIAL PRIMARY KEY;
    ELSE
        -- Se existir, verifica se é uma primary key
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'targets' 
                      AND constraint_type = 'PRIMARY KEY') THEN
            -- Remove qualquer constraint existente na coluna id
            ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_pkey;
            -- Configura a coluna id como serial e primary key
            ALTER TABLE targets ALTER COLUMN id SET DEFAULT nextval('targets_id_seq');
            ALTER TABLE targets ADD PRIMARY KEY (id);
        END IF;
    END IF;
END $$;