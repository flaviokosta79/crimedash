import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{
    id: string;
    position: [number, number];
    radius: number;
    color: string;
    popup: {
      title: string;
      type: string;
      count: number;
      bairros: string[];
    };
  }>;
}

// Este componente usa a API imperativa do Leaflet em vez do React-Leaflet
const Map = ({ center, zoom, markers }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Configuração inicial do mapa
    if (!mapRef.current || mapInstanceRef.current) return;
    
    console.log('Inicializando mapa imperativo em', center);
    
    // Certifique-se de que o ícone padrão está configurado
    if (typeof L.Icon.Default.imagePath !== 'string') {
      L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
      
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
    
    // Criar o mapa
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      attributionControl: true,
      zoomControl: true
    });
    
    // Adicionar a camada de tile
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Guardar a instância do mapa
    mapInstanceRef.current = map;
    
    // Limpeza quando o componente for desmontado
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);
  
  // Efeito para adicionar/atualizar markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    console.log('Adicionando', markers.length, 'marcadores ao mapa');
    
    // Limpar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });
    
    // Adicionar novos marcadores
    markers.forEach(({ position, radius, color, popup, id }) => {
      const circle = L.circle(position, {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.4,
        weight: 1
      }).addTo(map);
      
      // Adicionar evento de mouseover
      circle.on('mouseover', function() {
        circle.setStyle({
          fillOpacity: 0.7,
          weight: 2,
          opacity: 0.9
        });
      });
      
      // Adicionar evento de mouseout
      circle.on('mouseout', function() {
        circle.setStyle({
          fillOpacity: 0.4,
          weight: 1,
          opacity: 0.6
        });
      });
      
      // Adicionar popup
      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg">${popup.title}</h3>
          <div class="flex items-center mt-2">
            <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px;"></div>
            <span>${popup.type}: ${popup.count} ocorrência${popup.count !== 1 ? 's' : ''}</span>
          </div>
          ${popup.bairros.length > 0 ? `
            <div class="mt-2">
              <p class="font-medium">Bairros:</p>
              <ul class="list-disc pl-5 text-sm">
                ${popup.bairros.map(bairro => `<li>${bairro}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
      
      circle.bindPopup(popupContent);
    });
    
    // Ajustar a visualização para incluir todos os marcadores
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, mapInstanceRef.current]);
  
  return <div ref={mapRef} className="h-full w-full" />;
};

export default Map;