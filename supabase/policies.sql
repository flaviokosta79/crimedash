-- Habilitar RLS para as tabelas
ALTER TABLE crimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_timeseries ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela crimes
CREATE POLICY "Enable insert for authenticated users" ON crimes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON crimes
  FOR SELECT USING (true);

-- Criar políticas para a tabela crime_timeseries
CREATE POLICY "Enable insert for authenticated users" ON crime_timeseries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON crime_timeseries
  FOR SELECT USING (true);
