import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { CrimeData } from '../types';
import { supabase, getSupabaseAdmin } from '../config/supabase';

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
      const { error: deleteError } = await getSupabaseAdmin()
        .from('crimes2')
        .delete()
        .neq('objectid', '0'); // usando neq para garantir que a query afete todas as linhas

      if (deleteError) {
        console.error('Erro ao limpar dados:', deleteError);
        throw deleteError;
      }

      // Limpar série temporal
      const { error: deleteTimeseriesError } = await getSupabaseAdmin()
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
          const dia = String(row['Dia do registro']).padStart(2, '0');
          const mes = String(row['Mês do registro']).padStart(2, '0');
          const ano = row['Ano do registro'];
          const data_fato = ano && mes && dia ? `${ano}-${mes}-${dia}` : null;

          // Converter hora_fato para formato HH:MM:SS
          const faixaHoraria = row['Faixa horária'] || '';
          const horaInicio = faixaHoraria.split('h')[0];
          const hora_fato = horaInicio ? `${horaInicio.padStart(2, '0')}:00:00` : null;

          // Limpar e validar campos de texto
          const cleanText = (text: string | number | undefined) => {
            if (text === undefined || text === null || String(text).trim() === '') return 'N/A';
            return String(text).trim().replace(/\s+/g, ' ');
          };

          const crime = {
            objectid: row['objectid'] || '0',
            "Dia do registro": dia,
            "Mes do registro": mes,
            "Ano do registro": ano,
            "RO": cleanText(row['RO']),
            "Titulo do delito": cleanText(row['Título do delito']),
            "Titulo do DO": cleanText(row['Título do DO']),
            "Indicador estrategico": cleanText(row['Indicador estratégico']),
            "Fase de divulgacao": cleanText(row['Fase de divulgação']),
            "Dia da semana do fato": cleanText(row['Dia da semana do fato']),
            "CISP do fato": cleanText(row['CISP do fato']),
            "AISP do fato": cleanText(row['AISP do fato']),
            "RISP do fato": cleanText(row['RISP do fato']),
            "Municipio do fato (IBGE)": cleanText(row['Município do fato (IBGE)']),
            "Bairro": cleanText(row['Bairro']),
            "Faixa horaria": cleanText(row['Faixa horária'])
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
        
        const { error } = await getSupabaseAdmin()
          .from('crimes2')
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
        const dia = String(crime['Dia do registro']).padStart(2, '0');
        const mes = String(crime['Mes do registro']).padStart(2, '0');
        const ano = crime['Ano do registro'];
        const date = `${ano}-${mes}-${dia}`;
        const unit = crime['AISP do fato'];
        const key = `${date}_${unit}`;
        
        if (!acc[key]) {
          acc[key] = {
            date,
            unit,
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
        
        const { error: timeseriesError } = await getSupabaseAdmin()
          .from('crime_timeseries')
          .insert(batch);

        if (timeseriesError) {
          console.error('Erro ao inserir série temporal:', timeseriesError);
          throw timeseriesError;
        }
      }

      // Atualizar a view materializada
      const { error: refreshError } = await getSupabaseAdmin()
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
      .from('crimes2')
      .select('*')
      .eq('AISP do fato', unit);

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
  },

  async getTimeSeriesData(unit: string, startDate: Date, endDate: Date) {
    try {
      const { data, error } = await supabase
        .from('crimes2')
        .select('*')
        .eq('AISP do fato', unit)
        .gte('data_fato', startDate.toISOString().split('T')[0])
        .lte('data_fato', endDate.toISOString().split('T')[0])
        .order('data_fato', { ascending: true });

      if (error) throw error;

      // Criar um objeto com todas as datas no intervalo
      const dates: { [key: string]: any } = {};
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dates[dateStr] = {
          date: dateStr,
          'Letalidade Violenta': 0,
          'Roubo de Veículo': 0,
          'Roubo de Rua': 0,
          'Roubo de Carga': 0
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Agrupar dados por data
      data?.forEach(crime => {
        const date = crime.data_fato;
        if (dates[date]) {
          switch (crime['Indicador estrategico']) {
            case 'Letalidade Violenta':
              dates[date]['Letalidade Violenta']++;
              break;
            case 'Roubo de Veículo':
              dates[date]['Roubo de Veículo']++;
              break;
            case 'Roubo de Rua':
              dates[date]['Roubo de Rua']++;
              break;
            case 'Roubo de Carga':
              dates[date]['Roubo de Carga']++;
              break;
          }
        }
      });

      // Converter objeto agrupado em array
      return Object.values(dates);
    } catch (error) {
      console.error('Erro ao buscar série temporal:', error);
      return [];
    }
  }
};
