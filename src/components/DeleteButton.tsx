import React, { useState, useEffect } from 'react';

interface DeleteButtonProps {
  onClick: () => Promise<void>;
  size?: 'small' | 'normal';
  label?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  onClick, 
  size = 'normal',
  label = 'Limpar Dados'
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isHovering && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHovering, countdown]);

  useEffect(() => {
    if (!isHovering) {
      setCountdown(3);
    }
  }, [isHovering]);

  const handleClick = async () => {
    if (countdown === 0 && !isLoading) {
      setIsLoading(true);
      try {
        await onClick();
      } finally {
        setIsLoading(false);
        setIsHovering(false);
        setCountdown(3);
      }
    }
  };

  return (
    <button
      onMouseEnter={() => !isLoading && setIsHovering(true)}
      onMouseLeave={() => !isLoading && setIsHovering(false)}
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${size === 'small' ? 'p-2' : 'px-4 py-2'} 
        ${isLoading ? 'bg-gray-500 cursor-not-allowed' :
          countdown === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
        } 
        text-white rounded-lg transition-all duration-200
        flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
        ${isHovering && !isLoading ? 'scale-105' : ''}
      `}
      title={size === 'small' ? 'Limpar Dados' : undefined}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={size === 'small' ? 'h-5 w-5' : 'h-5 w-5'} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      {size === 'normal' && (
        <span>
          {isLoading ? 'Limpando...' : 
            isHovering ? (countdown === 0 ? 'Clique para confirmar' : `Aguarde ${countdown}...`) : label}
        </span>
      )}
    </button>
  );
};