export interface CrimeData {
  id: string;
  date: string;
  type: CrimeType;
  unit: PoliceUnit;
  count: number;
  target: number;
  lat: number;
  lng: number;
  shift: Shift;
  region: string;
  bairros: string[]; // Adicionando o campo bairros
}

export type CrimeType = 
  | 'Letalidade Violenta'
  | 'Roubo de Veículo'
  | 'Roubo de Rua'
  | 'Roubo de Carga';

export type PoliceUnit = 
  | 'AISP 10'
  | 'AISP 28'
  | 'AISP 33'
  | 'AISP 37'
  | 'AISP 43'
  | 'RISP 5';

export type Shift = 'Manhã' | 'Tarde' | 'Noite';

export type TimeRange = 'D' | 'W' | 'M' | '6M' | 'Y';

export interface KPI {
  label: string;
  value: number;
  target: number;
  trend: number;
}

export interface Filters {
  timeRange: TimeRange;
  crimeType?: CrimeType | 'all';
}
