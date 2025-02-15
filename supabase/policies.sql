-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON crimes;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON crimes;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON crimes;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON crimes;

-- Remover políticas existentes para crime_timeseries
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON crime_timeseries;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON crime_timeseries;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON crime_timeseries;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON crime_timeseries;

-- Remover políticas existentes para targets
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON targets;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON targets;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON targets;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON targets;

-- Desabilitar RLS temporariamente
ALTER TABLE crimes DISABLE ROW LEVEL SECURITY;
ALTER TABLE crime_timeseries DISABLE ROW LEVEL SECURITY;
ALTER TABLE targets DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS
ALTER TABLE crimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas
CREATE POLICY "Permitir todas as operações para usuários autenticados"
ON crimes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir todas as operações para usuários autenticados"
ON crime_timeseries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir todas as operações para usuários autenticados"
ON targets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir que o papel authenticated tenha as permissões necessárias
GRANT ALL ON crimes TO authenticated;
GRANT ALL ON crime_timeseries TO authenticated;
GRANT ALL ON targets TO authenticated;

-- Garantir que as sequências também sejam acessíveis
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
