import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CrimeData, CrimeType } from '../types';
import L from 'leaflet';

// Define a custom icon for the marker
const crimeIcon = new L.Icon({
  iconUrl: '/crime-marker.png', // Replace with your actual icon path
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: null,
  shadowSize: [0,0],
  shadowAnchor: [0, 0]
});

interface CrimeMapProps {
  data: CrimeData[];
}

export const CrimeMap: React.FC<CrimeMapProps> = ({ data }) => {
  const [selectedCrime, setSelectedCrime] = useState<CrimeData | null>(null);

  // Calculate center based on data points
  const center = data.length > 0
    ? {
        lat: data.reduce((sum, point) => sum + point.lat, 0) / data.length,
        lng: data.reduce((sum, point) => sum + point.lng, 0) / data.length
      }
    : { lat: -22.9068, lng: -43.1729 }; // Default to Rio de Janeiro region

  const handleMapClick = (event: any) => {
    const { lat, lng } = event.latlng;
    const closestCrime = data.reduce((prev, curr) => {
      const prevDistance = Math.sqrt(Math.pow(prev.lat - lat, 2) + Math.pow(prev.lng - lng, 2));
      const currDistance = Math.sqrt(Math.pow(curr.lat - lat, 2) + Math.pow(curr.lng - lng, 2));
      return currDistance < prevDistance ? curr : prev;
    });
    setSelectedCrime(closestCrime);
  };

  const getColor = (crimeType: CrimeType): string => {
    switch (crimeType) {
      case 'Letalidade Violenta':
        return '#ff7f0e';
      case 'Roubo de Veículo':
        return '#2ca02c';
      case 'Roubo de Rua':
        return '#d62728';
      case 'Roubo de Carga':
        return '#9467bd';
      default:
        return '#000000'; // Black as default
    }
  };

  return (
    <div className="h-[400px] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
        onClick={handleMapClick}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.map((crime) => (
          <Circle
            key={crime.id}
            center={[crime.lat, crime.lng]}
            radius={1000}
            pathOptions={{
              color: getColor(crime.type),
              fillOpacity: 0.7
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <p className="font-semibold">{crime.region}</p>
                <p>{crime.type}</p>
                <p>Ocorrências: {crime.count}</p>
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};
