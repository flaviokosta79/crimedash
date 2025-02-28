export type PoliceUnit = 
  | 'AISP 10'
  | 'AISP 28'
  | 'AISP 33'
  | 'AISP 37'
  | 'AISP 43'
  | 'RISP 5';

export type PoliceRegion = 
  | 'RISP 1'
  | 'RISP 2'
  | 'RISP 3'
  | 'RISP 4'
  | 'RISP 5'
  | 'RISP 6'
  | 'RISP 7';

export type CrimeType = 
  | 'Letalidade Violenta'
  | 'Roubo de Veículo'
  | 'Roubo de Rua'
  | 'Roubo de Carga';

export type TimeRange = 
  | '7D'  // Últimos 7 dias
  | '30D' // Últimos 30 dias
  | '90D' // Últimos 90 dias;

export interface Filters {
  timeRange: TimeRange;
  unit: PoliceUnit | '';
}

export interface CrimeData {
  id: string;
  date: string;
  type: CrimeType;
  unit: PoliceUnit;
  region: PoliceRegion;
  count: number;
  target: number;
  lat: number;
  lng: number;
}
