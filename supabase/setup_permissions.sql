-- Dar permissão para o service_role em todas as tabelas
GRANT ALL ON crimes TO service_role;
GRANT ALL ON crime_timeseries TO service_role;

-- Dar permissão para o service_role em todas as sequences
GRANT ALL ON crimes_id_seq TO service_role;
GRANT ALL ON crime_timeseries_id_seq TO service_role;

-- Dar permissão para o service_role em todas as views materializadas
GRANT ALL ON mv_unit_totals TO service_role;

-- Dar permissão para o anon em todas as views materializadas
GRANT SELECT ON mv_unit_totals TO anon;

-- Dar permissão para o anon nas tabelas (somente leitura)
GRANT SELECT ON crimes TO anon;
GRANT SELECT ON crime_timeseries TO anon;

-- Alterar o owner das views materializadas para authenticator
ALTER MATERIALIZED VIEW mv_unit_totals OWNER TO authenticator;
