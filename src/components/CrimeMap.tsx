import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CrimeData, CrimeType } from '../types';

// Fix the leaflet icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Cores consistentes para todos os tipos de crime
const CRIME_COLORS = {
  'Letalidade Violenta': '#ff7f0e',
  'Roubo de Veículo': '#2ca02c',
  'Roubo de Rua': '#d62728',
  'Roubo de Carga': '#9467bd'
} as const;

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
  const [hoveredCrimes, setHoveredCrimes] = useState<CrimeData[]>([]);

  // Calculate center based on data points if not provided
  const defaultCenter = { lat: -22.9068, lng: -43.1729 }; // Default to Rio de Janeiro region
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

  // Encontrar crimes próximos
  const findNearbyCrimes = (targetLat: number, targetLng: number) => {
    const DISTANCE_THRESHOLD = 0.02; // Aproximadamente 2km
    return data.filter(crime => {
      const latDiff = Math.abs(crime.lat - targetLat);
      const lngDiff = Math.abs(crime.lng - targetLng);
      return latDiff < DISTANCE_THRESHOLD && lngDiff < DISTANCE_THRESHOLD;
    });
  };

  if (!mapCenter || typeof mapCenter.lat !== 'number' || typeof mapCenter.lng !== 'number') {
    return <div className="h-[500px] bg-gray-100 flex items-center justify-center">Mapa indisponível</div>;
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border-2 border-gray-200">
      <MapContainer
        key={`${mapCenter.lat}-${mapCenter.lng}-${zoom}`}
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.map((crime) => (
          <Circle
            key={crime.id}
            center={[crime.lat, crime.lng]}
            radius={getRadius(crime.count)}
            pathOptions={{
              color: getColor(crime.type),
              fillColor: getColor(crime.type),
              fillOpacity: 0.4,
              weight: 1,
              opacity: 0.6
            }}
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: 0.7,
                  weight: 2,
                  opacity: 0.9
                });
                const nearbyCrimes = findNearbyCrimes(crime.lat, crime.lng);
                setHoveredCrimes(nearbyCrimes);
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: 0.4,
                  weight: 1,
                  opacity: 0.6
                });
                setHoveredCrimes([]);
              }
            }}
          >
            {hoveredCrimes.length > 0 && hoveredCrimes.includes(crime) && (
              <Tooltip>
                <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 max-w-xs">
                  {hoveredCrimes.map((nearbyCrime, index) => (
                    <div key={nearbyCrime.id} className={index > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-lg">{nearbyCrime.region}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getColor(nearbyCrime.type) }}
                        />
                        <p className="text-sm">{nearbyCrime.type}</p>
                        <p className="text-sm font-semibold ml-auto">
                          {nearbyCrime.count} ocorrência{nearbyCrime.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {nearbyCrime.bairros && nearbyCrime.bairros.length > 0 && (
                        <div className="mt-1 text-sm text-gray-600">
                          <p className="font-medium mb-1">Bairros:</p>
                          <ul className="list-disc pl-4 text-xs space-y-0.5">
                            {nearbyCrime.bairros.map((bairro, idx) => (
                              <li key={idx}>{bairro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Tooltip>
            )}
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};
