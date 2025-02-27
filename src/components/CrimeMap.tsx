import React, { useState, useEffect } from 'react';
import type { CrimeData, CrimeType } from '../types';
import { ClientOnly } from './ClientOnly';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import ImperativeMap from './Map';

// Cores consistentes para todos os tipos de crime
const CRIME_COLORS = {
  'Letalidade Violenta': '#ff7f0e',
  'Roubo de Veículo': '#2ca02c',
  'Roubo de Rua': '#d62728',
  'Roubo de Carga': '#9467bd'
} as const;

// Fix para os ícones do Leaflet
if (typeof window !== 'undefined') {
  // Prevenir múltiplas redefinições do ícone durante hot reload
  if (!L.Icon.Default.imagePath) {
    L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
    
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
}

interface CrimeMapProps {
  data: CrimeData[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const CrimeMap: React.FC<CrimeMapProps> = ({ 
  data = [], 
  center, 
  zoom = 10
}) => {
  const [useImperativeMap, setUseImperativeMap] = useState(false);
  console.log('CrimeMap recebeu', data.length, 'pontos de dados');
  
  // Fallback para abordagem imperativa em caso de erro
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Se não houver erros conhecidos, continuar com React-Leaflet
      } catch (error) {
        console.error('Erro detectado no React-Leaflet, usando implementação imperativa:', error);
        setUseImperativeMap(true);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!data.length) {
    return (
      <div className="h-[500px] bg-gray-100 flex items-center justify-center">
        <span className="text-gray-600">Sem dados para exibir no mapa</span>
      </div>
    );
  }

  // Calcular centro baseado nos pontos de dados se não fornecido
  const defaultCenter = { lat: -22.9068, lng: -43.1729 }; // Default para região do Rio de Janeiro
  const mapCenter = center || (data.length > 0
    ? {
        lat: data.reduce((sum, point) => sum + point.lat, 0) / data.length,
        lng: data.reduce((sum, point) => sum + point.lng, 0) / data.length
      }
    : defaultCenter);

  const getColor = (crimeType: CrimeType): string => {
    return CRIME_COLORS[crimeType] || '#000000';
  };

  // Calcular o raio baseado no número de ocorrências
  const getRadius = (count: number): number => {
    return Math.min(300 + (count * 300), 3000);
  };

  // Preparar dados para o mapa imperativo
  const markers = data.map(crime => ({
    id: crime.id,
    position: [crime.lat, crime.lng] as [number, number],
    radius: getRadius(crime.count),
    color: getColor(crime.type),
    popup: {
      title: crime.region,
      type: crime.type,
      count: crime.count,
      bairros: crime.bairros
    }
  }));

  const Loading = () => (
    <div className="h-full bg-gray-100 flex items-center justify-center">
      <span className="text-gray-600">Carregando mapa...</span>
    </div>
  );

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border-2 border-gray-200 relative">
      <ClientOnly fallback={<Loading />}>
        {useImperativeMap ? (
          // Usar a implementação imperativa como fallback
          <ImperativeMap
            center={mapCenter}
            zoom={zoom}
            markers={markers}
          />
        ) : (
          // Usar o React-Leaflet como abordagem primária
          <MapContainer
            key={`map-${mapCenter.lat.toFixed(4)}-${mapCenter.lng.toFixed(4)}-${zoom}`}
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data.map((crime) => (
              <Circle
                key={`${crime.id}-${crime.lat}-${crime.lng}`}
                center={[crime.lat, crime.lng]}
                radius={getRadius(crime.count)}
                pathOptions={{
                  color: getColor(crime.type),
                  fillColor: getColor(crime.type),
                  fillOpacity: 0.4,
                  weight: 1
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      fillOpacity: 0.7,
                      weight: 2,
                      opacity: 0.9
                    });
                  },
                  mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle({
                      fillOpacity: 0.4,
                      weight: 1,
                      opacity: 0.6
                    });
                  }
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{crime.region}</h3>
                    <div className="flex items-center mt-2">
                      <div 
                        style={{ 
                          backgroundColor: getColor(crime.type), 
                          width: '12px', 
                          height: '12px',
                          borderRadius: '50%',
                          marginRight: '8px'
                        }}
                      />
                      <span>
                        {crime.type}: {crime.count} ocorrência{crime.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {crime.bairros && crime.bairros.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Bairros:</p>
                        <ul className="list-disc pl-5 text-sm">
                          {crime.bairros.map((bairro, idx) => (
                            <li key={idx}>{bairro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        )}
      </ClientOnly>
    </div>
  );
};
