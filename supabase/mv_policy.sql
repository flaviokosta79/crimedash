-- Habilitar RLS para a view materializada
ALTER MATERIALIZED VIEW mv_unit_totals ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura
CREATE POLICY "Enable read access for all users" ON mv_unit_totals
  FOR SELECT USING (true);
