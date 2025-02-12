-- Remover trigger e funções existentes
DROP TRIGGER IF EXISTS trigger_refresh_mv_unit_totals ON crimes;
DROP FUNCTION IF EXISTS refresh_mv_unit_totals() CASCADE;
DROP FUNCTION IF EXISTS trigger_refresh_mv_unit_totals() CASCADE;

-- Criar função para atualizar a view materializada (para chamada via RPC)
CREATE OR REPLACE FUNCTION refresh_mv_unit_totals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_unit_totals;
END;
$$;

-- Criar função para o trigger
CREATE OR REPLACE FUNCTION trigger_refresh_mv_unit_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_unit_totals;
  RETURN NEW;
END;
$$;

-- Dar permissão para o service_role executar as funções
GRANT EXECUTE ON FUNCTION refresh_mv_unit_totals() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_refresh_mv_unit_totals() TO service_role;

-- Criar trigger para atualizar a view quando houver mudanças
CREATE TRIGGER trigger_refresh_mv_unit_totals
    AFTER INSERT OR UPDATE OR DELETE ON crimes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_mv_unit_totals();
