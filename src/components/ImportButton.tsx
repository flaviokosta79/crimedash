import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { crimeService } from '../services/crimeService';
import { toast } from 'react-hot-toast';

interface ImportButtonProps {
  onSuccess?: () => void; // Tornei opcional e renomeei para corresponder ao uso no Dashboard
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      toast.loading('Importando dados...', { id: 'import' });
      await crimeService.importXLSX(file);
      
      // Chama o callback se existir
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
      
      toast.success('Dados importados com sucesso!', { id: 'import' });
    } catch (error: any) {
      console.error('Erro ao importar arquivo:', error);
      toast.error(`Erro ao importar arquivo: ${error.message}`, { id: 'import' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <button
      onClick={() => fileInputRef.current?.click()}
      disabled={loading}
      className="flex flex-col items-center justify-center p-6 border rounded-lg shadow-lg transition-colors w-full h-full bg-blue-50 border-blue-300 hover:bg-blue-100"
    >
      <div className="text-4xl mb-3 text-blue-600">
        <Upload />
      </div>
      <div className="text-lg font-semibold mb-1">
        {loading ? 'Importando...' : 'Importar Dados XLSX'}
      </div>
      <p className="text-sm text-gray-600">
        Carrega uma planilha de ocorrências no formato xlsx
      </p>
      <div className="mt-2 text-xs text-gray-500">
        Clique para selecionar o arquivo
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
      />
    </button>
  );
};
