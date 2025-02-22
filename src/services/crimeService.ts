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
  'Historico': string;
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
        .neq('objectid', '0');

      if (deleteError) {
        console.error('Erro ao limpar dados:', deleteError);
        throw deleteError;
      }

      // Ler arquivo XLSX
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      console.log('Total de linhas lidas:', rows.length);

      // Processar os crimes em lotes
      const batchSize = 1000;
      const crimes = rows.map((row: any, index: number) => {
        try {
          const dia = String(row['Dia do registro']).padStart(2, '0');
          const mes = String(row['Mês do registro']).padStart(2, '0');
          const ano = row['Ano do registro'];

          // Limpar e validar campos de texto
          const cleanText = (text: string | number | undefined) => {
            if (text === undefined || text === null || String(text).trim() === '') return 'N/A';
            return String(text).trim().replace(/\s+/g, ' ').toLowerCase();
          };

          // Normalizar o indicador estratégico com match exato
          const normalizeIndicador = (indicador: string) => {
            if (!indicador) return null;
            const ind = cleanText(indicador);
            
            // Match exato para cada tipo de crime
            if (ind === 'letalidade violenta') return 'letalidade violenta';
            if (ind === 'roubo de rua') return 'roubo de rua';
            if (ind === 'roubo de veículo') return 'roubo de veículo';
            if (ind === 'roubo de carga') return 'roubo de carga';
            
            return null; // Retorna null para indicadores não reconhecidos
          };

          // Normalizar RISP
          const normalizeRISP = (risp: string) => {
            if (!risp) return null;
            const rispText = cleanText(risp);
            // Extrair apenas o número da RISP
            const rispNumber = rispText.match(/\d+/)?.[0];
            if (!rispNumber) return null;
            return `RISP ${rispNumber}`;
          };

          const indicadorNormalizado = normalizeIndicador(row['Indicador estratégico']);
          const rispNormalizada = normalizeRISP(row['RISP do fato']);
          
          // Se o indicador não for válido ou a RISP não for válida, pula o registro
          if (!indicadorNormalizado || !rispNormalizada) {
            console.log(`Linha ${index + 1}: Dados inválidos - Indicador: "${row['Indicador estratégico']}", RISP: "${row['RISP do fato']}"`);
            return null;
          }

          return {
            objectid: row['objectid'] || '0',
            "Dia do registro": dia,
            "Mes do registro": mes,
            "Ano do registro": ano,
            "RO": cleanText(row['RO']),
            "Titulo do delito": cleanText(row['Título do delito']),
            "Titulo do DO": cleanText(row['Título do DO']),
            "Indicador estrategico": indicadorNormalizado,
            "Fase de divulgacao": cleanText(row['Fase de divulgação']),
            "Dia da semana do fato": cleanText(row['Dia da semana do fato']),
            "CISP do fato": cleanText(row['CISP do fato']),
            "AISP do fato": row['AISP do fato'],
            "RISP do fato": rispNormalizada,
            "Municipio do fato (IBGE)": cleanText(row['Município do fato (IBGE)']),
            "Bairro": cleanText(row['Bairro']),
            "Faixa horaria": cleanText(row['Faixa horária']),
            "Historico": cleanText(row['Historico'])
          };
        } catch (err) {
          console.error('Erro ao processar linha:', index, row, err);
          return null;
        }
      }).filter(crime => crime !== null);

      console.log('Crimes válidos processados:', crimes.length);
      
      // Log para verificar a distribuição por RISP
      const rispDistribution = crimes.reduce((acc: any, crime) => {
        const risp = crime['RISP do fato'];
        acc[risp] = (acc[risp] || 0) + 1;
        return acc;
      }, {});
      console.log('Distribuição por RISP:', rispDistribution);

      // Inserir em lotes
      for (let i = 0; i < crimes.length; i += batchSize) {
        const batch = crimes.slice(i, i + batchSize);
        const { error: insertError } = await getSupabaseAdmin()
          .from('crimes2')
          .insert(batch);

        if (insertError) {
          console.error('Erro ao inserir lote:', insertError);
          throw insertError;
        }
        console.log(`Lote ${Math.floor(i/batchSize) + 1} inserido com sucesso`);
      }

      console.log('Importação concluída com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
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
