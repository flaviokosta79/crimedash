-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Enable all for service_role" ON crimes;
DROP POLICY IF EXISTS "Enable select for anon" ON crimes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON crimes;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON crimes;
DROP POLICY IF EXISTS "Enable all for service_role" ON crime_timeseries;
DROP POLICY IF EXISTS "Enable select for anon" ON crime_timeseries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON crime_timeseries;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON crime_timeseries;

-- Habilitar RLS nas tabelas
ALTER TABLE crimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_timeseries ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela crimes
CREATE POLICY "Enable all for service_role" ON crimes
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable select for anon" ON crimes
    FOR SELECT
    USING (true);

-- Criar políticas para a tabela crime_timeseries
CREATE POLICY "Enable all for service_role" ON crime_timeseries
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable select for anon" ON crime_timeseries
    FOR SELECT
    USING (true);
