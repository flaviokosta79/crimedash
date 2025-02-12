-- Remover a view materializada existente
DROP MATERIALIZED VIEW IF EXISTS mv_unit_totals;

-- Recriar a view materializada
CREATE MATERIALIZED VIEW mv_unit_totals AS
SELECT 
    c.aisp as unit,
    COUNT(*) as total,
    SUM(CASE 
        WHEN LOWER(c.tipo_do_delito) LIKE '%homicídio%' 
        OR LOWER(c.tipo_do_delito) LIKE '%lesão corporal seguida de morte%' 
        THEN 1 ELSE 0 
    END) as lethal_violence,
    SUM(CASE 
        WHEN LOWER(c.tipo_do_delito) LIKE '%roubo de rua%' 
        THEN 1 ELSE 0 
    END) as street_robbery,
    SUM(CASE 
        WHEN LOWER(c.tipo_do_delito) LIKE '%roubo de veículo%' 
        THEN 1 ELSE 0 
    END) as vehicle_robbery,
    SUM(CASE 
        WHEN LOWER(c.tipo_do_delito) LIKE '%roubo de carga%' 
        THEN 1 ELSE 0 
    END) as cargo_robbery
FROM crimes c
GROUP BY c.aisp;

-- Verificar os dados
SELECT * FROM mv_unit_totals;

-- Verificar os dados brutos
SELECT aisp, tipo_do_delito, COUNT(*) 
FROM crimes 
GROUP BY aisp, tipo_do_delito;
