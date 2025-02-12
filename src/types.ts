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
}

export type CrimeType = 
  | 'Letalidade Violenta'
  | 'Roubo de Veículo'
  | 'Roubo de Rua'
  | 'Roubo de Carga';

export type PoliceUnit = 
  | '10o BPM'
  | '28o BPM'
  | '33o BPM'
  | '37o BPM'
  | '2a CIPM';

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
