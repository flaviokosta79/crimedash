import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { CrimeData } from '../types';

// Cliente normal para operações de leitura
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Cliente com service_role para importação
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Log da configuração (sem mostrar as chaves completas)
console.log('Configuração Supabase:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...',
  serviceKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...'
});

interface XLSXRow {
  'objectid': string;
  'Dia do fato': string;
  'Mês do fato': string;
  'Ano do fato': string;
  'RO': string;
  'Título do delito': string;
  'Título do DO': string;
  'Indicador estratégico': string;
  'Fase de divulgação': string;
  'Dia da semana do fato': string;
  'CISP do fato': string; // aisp
  'AISP do fato': string;
  'RISP do fato': string;
  'Município do fato (IBGE)': string;
  'Bairro': string;
  'Faixa horária': string;
}

export const crimeService = {
  async importXLSX(file: File) {
    try {
      console.log('Iniciando importação do arquivo:', file.name);
      
      // Limpar dados existentes
      console.log('Limpando dados existentes...');
      const { error: deleteError } = await supabaseAdmin
        .from('crimes')
        .delete()
        .neq('seq', 0); // usando neq para garantir que a query afete todas as linhas

      if (deleteError) {
        console.error('Erro ao limpar dados:', deleteError);
        throw deleteError;
      }

      // Limpar série temporal
      const { error: deleteTimeseriesError } = await supabaseAdmin
        .from('crime_timeseries')
        .delete()
        .neq('count', -1); // usando neq para garantir que a query afete todas as linhas

      if (deleteTimeseriesError) {
        console.error('Erro ao limpar série temporal:', deleteTimeseriesError);
        throw deleteTimeseriesError;
      }

      console.log('Dados antigos removidos com sucesso');
      
      const data = await file.arrayBuffer();
      console.log('Arquivo carregado em memória');
      
      const workbook = XLSX.read(data);
      console.log('XLSX lido com sucesso. Sheets:', workbook.SheetNames);
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<XLSXRow>(worksheet);

      console.log('Dados lidos do XLSX:', jsonData.length, 'registros');
      if (jsonData.length > 0) {
        console.log('Exemplo do primeiro registro:', JSON.stringify(jsonData[0], null, 2));
      }

      // Mapear os dados para o formato do banco
      const crimes = jsonData.map((row, index) => {
        try {
          // Depois (código correto)
          const dia = String(row['Dia do fato']).padStart(2, '0');
          const mes = String(row['Mês do fato']).padStart(2, '0');
          const ano = row['Ano do fato'];
          const data_fato = `${ano}-${mes}-${dia}`

          // Converter hora_fato para formato HH:MM:SS
          const faixaHoraria = row['Faixa horária'] || '';
          const horaInicio = faixaHoraria.split('h')[0];
          const hora_fato = `${horaInicio.padStart(2, '0')}:00:00`;

          // Limpar e validar campos de texto
          const cleanText = (text: string | number | undefined) => {
            if (text === undefined || text === null) return '';
            return String(text).trim().replace(/\s+/g, ' ');
          };

          const crime = {
            seq: parseInt(row['objectid'] || '0'),
            seq_bo: 0, // Não tem no arquivo
            ano_bo: parseInt(row['Ano do fato'] || '2025'),
            data_fato,
            hora_fato,
            data_comunicacao: data_fato, // Usando a mesma data do fato
            titulo_do_delito: cleanText(row['Título do delito']),
            tipo_do_delito: cleanText(row['Título do DO']),
            indicador_estrategico: cleanText(row['Indicador estratégico']),
            fase_divulgacao: cleanText(row['Fase de divulgação']),
            dia_semana: cleanText(row['Dia da semana do fato']),
            aisp: cleanText(row['AISP do fato']), // Usando diretamente a coluna 'CISP do fato'
            risp: cleanText(row['RISP do fato']),
            municipio: cleanText(row['Município do fato (IBGE)']),
            bairro: cleanText(row['Bairro']),
            faixa_horario: cleanText(row['Faixa horária'])
          };

          if (index === 0) {
            console.log('Primeiro crime processado:', crime);
          }
          
          return crime;
        } catch (err) {
          console.error('Erro ao processar linha:', index, row, err);
          return null;
        }
      }).filter(crime => crime !== null); // Remove os registros com erro

      console.log('Total de crimes processados:', crimes.length);

      // Inserir em lotes de 1000 registros usando supabaseAdmin
      const batchSize = 1000;
      for (let i = 0; i < crimes.length; i += batchSize) {
        const batch = crimes.slice(i, i + batchSize);
        console.log(`Inserindo lote ${i/batchSize + 1}:`, batch.length, 'registros');
        
        const { error } = await supabaseAdmin
          .from('crimes')
          .insert(batch);

        if (error) {
          console.error('Erro ao inserir lote:', error);
          throw error;
        }
        
        console.log(`Lote ${i/batchSize + 1} inserido com sucesso`);
      }

      // Calcular e inserir os dados de série temporal
      console.log('Calculando série temporal...');
      
      const timeseriesData = crimes.reduce((acc: any, crime) => {
        const date = crime.data_fato;
        const key = `${date}_${crime.aisp}`;
        
        if (!acc[key]) {
          acc[key] = {
            date,
            unit: crime.aisp,
            count: 0
          };
        }
        
        acc[key].count++;
        return acc;
      }, {});

      const timeseries = Object.values(timeseriesData);
      console.log('Série temporal calculada:', timeseries.length, 'registros');

      // Inserir série temporal
      for (let i = 0; i < timeseries.length; i += batchSize) {
        const batch = timeseries.slice(i, i + batchSize);
        console.log(`Inserindo lote de série temporal ${i/batchSize + 1}:`, batch.length, 'registros');
        
        const { error: timeseriesError } = await supabaseAdmin
          .from('crime_timeseries')
          .insert(batch);

        if (timeseriesError) {
          console.error('Erro ao inserir série temporal:', timeseriesError);
          throw timeseriesError;
        }
      }

      // Atualizar a view materializada
      const { error: refreshError } = await supabaseAdmin
        .rpc('refresh_mv_unit_totals');

      if (refreshError) {
        console.error('Erro ao atualizar view materializada:', refreshError);
        // Não vamos lançar erro aqui, pois os dados já foram inseridos
      }

      console.log('Importação concluída com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return { success: false, error };
    }
  },

  async getCrimesByUnit(unit: string) {
    const { data, error } = await supabase
      .from('crimes')
      .select('*')
      .eq('aisp', unit);

    if (error) throw error;
    return data;
  },

  async getTimeseriesByUnit(unit: string) {
    const { data, error } = await supabase
      .from('crime_timeseries')
      .select('*')
      .eq('unit', unit)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }
};
