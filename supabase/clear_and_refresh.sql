-- Limpar todas as tabelas
TRUNCATE TABLE crimes CASCADE;
TRUNCATE TABLE crime_timeseries CASCADE;

-- Atualizar a view materializada
REFRESH MATERIALIZED VIEW mv_unit_totals;
