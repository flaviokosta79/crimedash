import React, { useEffect, useState } from 'react';

/**
 * Componente que garante que o conteúdo filho só seja renderizado no cliente
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  const [hasMounted, setHasMounted] = useState(false);

  // Efeito disparado após a montagem do componente
  useEffect(() => {
    // Indicar que estamos no cliente
    setHasMounted(true);
    
    // Log para debug
    console.log('ClientOnly: Componente montado no cliente');
  }, []);

  // Durante a renderização no servidor ou primeira renderização no cliente
  if (!hasMounted) {
    console.log('ClientOnly: Renderizando fallback');
    return <>{fallback}</>;
  }

  console.log('ClientOnly: Renderizando conteúdo filho');
  return <>{children}</>;
}