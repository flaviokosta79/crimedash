import React, { useState } from 'react';
import { Target } from '../services/targetService';

interface EditableTargetValueProps {
  target: Target;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (target: Target) => void;
  onCancel: () => void;
  size?: 'small' | 'normal';
}

export const EditableTargetValue: React.FC<EditableTargetValueProps> = ({
  target,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  size = 'normal'
}) => {
  const [value, setValue] = useState(target.target_value);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          className={`min-w-0 flex-1 px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            size === 'small' ? 'text-sm' : 'text-base'
          }`}
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          min="0"
          autoFocus
        />
        <div className="flex gap-1 shrink-0">
          <button
            className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            onClick={() => onSave({ ...target, target_value: value })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="p-2 bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            onClick={onCancel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className={`font-bold truncate ${size === 'small' ? 'text-lg' : 'text-2xl'}`}>
        {target.target_value.toLocaleString('pt-BR')}
      </span>
      <button
        className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        onClick={onStartEdit}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
};