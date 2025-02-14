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

export interface Filters {
  timeRange: string;
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
