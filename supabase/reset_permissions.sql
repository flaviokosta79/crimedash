-- Remover todas as policies existentes
DROP POLICY IF EXISTS allow_select_crimes ON crimes;
DROP POLICY IF EXISTS allow_select_timeseries ON crime_timeseries;

-- Remover todas as grants existentes
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, service_role;

-- Dar todas as permissões para o service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Dar permissão de leitura para anon
GRANT SELECT ON crimes TO anon;
GRANT SELECT ON crime_timeseries TO anon;
GRANT SELECT ON mv_unit_totals TO anon;

-- Criar novas policies
CREATE POLICY allow_select_crimes ON crimes
    FOR SELECT TO anon
    USING (true);

CREATE POLICY allow_select_timeseries ON crime_timeseries
    FOR SELECT TO anon
    USING (true);

-- Alterar o owner das views materializadas
ALTER MATERIALIZED VIEW IF EXISTS mv_unit_totals OWNER TO postgres;
