import { getSupabaseAdmin, getTableName } from '../config/supabase';

export interface HistoryData {
  id?: number;
  objectid: number;
  ro: string;        // Alterado para minúsculo
  historico: string; // Alterado para minúsculo
  created_at?: string;
  updated_at?: string;
}

export const historyService = {
  /**
   * Busca históricos de uma ocorrência pelo número RO
   * @param ro Número do RO da ocorrência
   * @returns Array de registros de histórico
   */
  async getHistoryByRO(ro: string): Promise<HistoryData[]> {
    try {
      console.log(`historyService: Buscando históricos para RO: "${ro}"`);
      
      const { data, error } = await getSupabaseAdmin()
        .from(getTableName('HISTORY'))
        .select('*')
        .eq('ro', ro)  // Alterado para minúsculo
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      console.log(`historyService: Encontrados ${data?.length || 0} históricos para o RO "${ro}"`);
      return data || [];
    } catch (error: any) {
      console.error(`historyService: Erro ao buscar históricos para RO "${ro}":`, error);
      throw error;
    }
  },

  /**
   * Busca históricos relacionados a um objectid específico
   * @param objectid ID do objeto relacionado na tabela CRIMES
   * @returns Array de registros de histórico
   */
  async getHistoryByObjectId(objectid: number): Promise<HistoryData[]> {
    const { data, error } = await getSupabaseAdmin()
      .from(getTableName('HISTORY'))
      .select('*')
      .eq('objectid', objectid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico por objectid:', error);
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Adiciona um novo registro de histórico
   * @param historyData Dados do histórico a ser adicionado
   * @returns O registro de histórico adicionado
   */
  async addHistory(historyData: HistoryData): Promise<HistoryData> {
    const { data, error } = await getSupabaseAdmin()
      .from(getTableName('HISTORY'))
      .insert([historyData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar histórico:', error);
      throw new Error(`Erro ao adicionar histórico: ${error.message}`);
    }

    return data;
  },

  /**
   * Atualiza um registro de histórico existente
   * @param id ID do registro de histórico
   * @param historyData Dados do histórico a serem atualizados
   * @returns O registro de histórico atualizado
   */
  async updateHistory(id: number, historyData: Partial<HistoryData>): Promise<HistoryData> {
    const { data, error } = await getSupabaseAdmin()
      .from(getTableName('HISTORY'))
      .update(historyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar histórico:', error);
      throw new Error(`Erro ao atualizar histórico: ${error.message}`);
    }

    return data;
  },

  /**
   * Remove um registro de histórico
   * @param id ID do registro de histórico a ser removido
   * @returns Verdadeiro se removido com sucesso
   */
  async deleteHistory(id: number): Promise<boolean> {
    const { error } = await getSupabaseAdmin()
      .from(getTableName('HISTORY'))
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover histórico:', error);
      throw new Error(`Erro ao remover histórico: ${error.message}`);
    }

    return true;
  }
};