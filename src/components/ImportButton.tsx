import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { crimeService } from '../services/crimeService';

interface ImportButtonProps {
  onImportSuccess: () => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await crimeService.importXLSX(file);
      onImportSuccess();
      alert('Dados importados com sucesso!');
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      alert('Erro ao importar arquivo. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Upload size={16} />
        {loading ? 'Importando...' : 'Importar XLSX'}
      </button>
    </div>
  );
};
