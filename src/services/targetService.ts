import { supabase, getSupabaseAdmin } from '../config/supabase';

export interface Target {
  id?: number;
  unit: string;
  year: number;
  semester: number;
  crime_type: string;
  target_value: number;
  created_at?: string;
  updated_at?: string;
}

export const targetService = {
  async getTargets(year: number, semester: number) {
    try {
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('year', year)
        .eq('semester', semester)
        .order('unit');

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar metas:', error);
      throw error;
    }
  },

  async updateTarget(target: Target) {
    try {
      const { error } = await supabase
        .from('targets')
        .update({ 
          target_value: target.target_value,
          updated_at: new Date().toISOString()
        })
        .match({ 
          id: target.id,
          year: target.year,
          semester: target.semester
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  },

  async importTargets(targets: Target[]) {
    try {
      const { error } = await getSupabaseAdmin()
        .from('targets')
        .upsert(targets, {
          onConflict: 'unit,year,semester,crime_type',
          ignoreDuplicates: false
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao importar metas:', error);
      throw error;
    }
  },

  async clearTargets() {
    try {
      const { error } = await getSupabaseAdmin()
        .from('targets')
        .delete()
        .neq('id', 0);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Erro ao limpar metas:', error);
      throw error;
    }
  },

  async clearTargetsByUnit(unit: string, year: number, semester: number) {
    try {
      // Primeiro, salvamos os valores atuais para possível desfazer
      const { data: currentTargets, error: fetchError } = await getSupabaseAdmin()
        .from('targets')
        .select('*')
        .match({ unit, year, semester });

      if (fetchError) throw fetchError;

      // Armazenar em localStorage para recuperação
      localStorage.setItem(`targets_backup_${unit}`, JSON.stringify(currentTargets));

      // Em vez de deletar, vamos apenas zerar os valores
      const updatedTargets = currentTargets.map(target => ({
        ...target,
        target_value: 0,
        updated_at: new Date().toISOString()
      }));

      const { error: updateError } = await getSupabaseAdmin()
        .from('targets')
        .upsert(updatedTargets, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (updateError) throw updateError;
      return true;
    } catch (error: any) {
      console.error('Erro ao limpar metas da unidade:', error);
      throw error;
    }
  },

  async undoClearTargets(unit: string) {
    try {
      const backupData = localStorage.getItem(`targets_backup_${unit}`);
      if (!backupData) {
        throw new Error('Não há dados para restaurar');
      }

      const targets = JSON.parse(backupData);
      const { error } = await getSupabaseAdmin()
        .from('targets')
        .upsert(targets);

      if (error) throw error;

      // Limpar o backup após restaurar com sucesso
      localStorage.removeItem(`targets_backup_${unit}`);
      return true;
    } catch (error: any) {
      console.error('Erro ao desfazer limpeza de metas:', error);
      throw error;
    }
  },

  async initializeDatabaseSchema() {
    try {
      // Primeiro verifica se a tabela tem a estrutura correta
      const { error: checkError } = await getSupabaseAdmin()
        .from('targets')
        .select('id')
        .limit(1);

      // Se houver erro de coluna não existente, criamos a estrutura
      if (checkError && checkError.message.includes('column "id" does not exist')) {
        const { error } = await getSupabaseAdmin()
          .rpc('initialize_targets_schema');

        if (error) throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Erro ao inicializar schema:', error);
      throw error;
    }
  },

  async ensureTargetsExist(targets: Target[]) {
    try {
      // Tenta inicializar o schema primeiro
      await this.initializeDatabaseSchema();

      // Segue com o resto da lógica
      const { data: existingTargets, error: fetchError } = await getSupabaseAdmin()
        .from('targets')
        .select('*')
        .eq('year', targets[0].year)
        .eq('semester', targets[0].semester);

      if (fetchError) throw fetchError;

      // Preparar dados para insert/update
      const upsertData = targets.map(target => ({
        unit: target.unit,
        year: target.year,
        semester: target.semester,
        crime_type: target.crime_type,
        target_value: target.target_value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Realizar upsert usando a constraint única
      const { error: upsertError } = await getSupabaseAdmin()
        .from('targets')
        .upsert(upsertData, {
          onConflict: 'unit,year,semester,crime_type',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      return true;
    } catch (error: any) {
      console.error('Erro ao criar/atualizar metas:', error);
      throw error;
    }
  },

  canUndo(unit: string): boolean {
    return !!localStorage.getItem(`targets_backup_${unit}`);
  }
};