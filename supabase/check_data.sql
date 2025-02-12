-- Verificar dados na tabela crimes
SELECT COUNT(*) as total_crimes, aisp 
FROM crimes 
GROUP BY aisp;

-- Verificar dados na série temporal
SELECT COUNT(*) as total_timeseries, unit 
FROM crime_timeseries 
GROUP BY unit;

-- Verificar dados na view materializada
SELECT * FROM mv_unit_totals;

-- Verificar a definição da view materializada
SELECT definition 
FROM pg_matviews 
WHERE matviewname = 'mv_unit_totals';
