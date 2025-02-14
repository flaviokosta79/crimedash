export type PoliceUnit = 
  | 'AISP 10'
  | 'AISP 28'
  | 'AISP 33'
  | 'AISP 37'
  | 'AISP 43';

export type CrimeType = 
  | 'Letalidade Violenta'
  | 'Roubo de Veículo'
  | 'Roubo de Rua'
  | 'Roubo de Carga';

export type TimeRange = 
  | '7D'  // Últimos 7 dias
  | '15D' // Últimos 15 dias
  | '30D' // Últimos 30 dias
  | '90D' // Últimos 90 dias
  | '180D' // Últimos 180 dias
  | '1Y';  // Último ano

export interface Filters {
  timeRange: TimeRange;
  unit: PoliceUnit | '';
}

export interface CrimeData {
  id: string;
  date: Date;
  type: CrimeType;
  unit: PoliceUnit;
  count: number;
  lat: number;
  lng: number;
  region: string;
}
