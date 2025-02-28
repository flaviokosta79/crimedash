import React, { useRef, useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getSupabaseAdmin, getTableName } from '../config/supabase';

interface ImportHistoryButtonProps {
  onSuccess?: () => void;
}

export const ImportHistoryButton: React.FC<ImportHistoryButtonProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async (file: File) => {
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading('Importando históricos...');

    try {
      // Ler o arquivo usando a biblioteca XLSX
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet) as Array<{ RO: string; Historico: string }>;

          // Validar estrutura das colunas
          if (!rows.length || !('RO' in rows[0]) || !('Historico' in rows[0])) {
            throw new Error('Formato inválido. O arquivo deve ter as colunas: RO, Historico');
          }

          let importados = 0;
          let erros = 0;

          // Processar cada linha
          for (const row of rows) {
            if (!row.RO || !row.Historico) {
              console.warn('Linha inválida:', row);
              erros++;
              continue;
            }

            try {
              // Buscar o objectid correspondente ao RO
              const { data: crime } = await getSupabaseAdmin()
                .from(getTableName('CRIMES'))
                .select('objectid')
                .eq('RO', row.RO)
                .single();

              if (!crime) {
                console.warn(`RO não encontrado: ${row.RO}`);
                erros++;
                continue;
              }

              // Inserir o histórico - usando os nomes de colunas em minúsculas (ro, historico)
              const { error } = await getSupabaseAdmin()
                .from(getTableName('HISTORY'))
                .insert({
                  objectid: crime.objectid,
                  ro: row.RO,
                  historico: row.Historico
                });

              if (error) throw error;
              importados++;
            } catch (err) {
              console.error(`Erro ao processar RO ${row.RO}:`, err);
              erros++;
            }
          }

          // Mostrar resultado da importação
          if (importados > 0) {
            toast.success(
              `Importação concluída: ${importados} históricos importados${erros > 0 ? `, ${erros} erros` : ''}`,
              { id: toastId }
            );
            onSuccess?.();
          } else {
            toast.error(
              `Nenhum histórico importado${erros > 0 ? `. ${erros} erros encontrados` : ''}`,
              { id: toastId }
            );
          }
        } catch (error: any) {
          console.error('Erro ao processar arquivo:', error);
          toast.error(`Erro ao importar históricos: ${error.message}`, { id: toastId });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Erro ao ler arquivo:', error);
      toast.error(`Erro ao ler arquivo: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex flex-col items-center justify-center p-6 border border-blue-300 bg-blue-50 rounded-lg w-full h-full shadow transition-colors hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="text-4xl mb-3 text-blue-600">
          <FiUpload />
        </div>
        <div className="text-lg font-semibold mb-1">
          Importar Históricos
        </div>
        <p className="text-sm text-gray-600 text-center">
          Importa históricos das ocorrências de um arquivo XLSX ou CSV
        </p>
        <div className="mt-2 text-xs text-gray-500">
          O arquivo deve conter as colunas: RO, Historico
        </div>
      </button>
    </div>
  );
};