export type PoliceUnit = 
  | 'AISP 10'
  | 'AISP 28'
  | 'AISP 33'
  | 'AISP 37'
  | 'AISP 43';

export interface Filters {
  timeRange: string;
  unit: PoliceUnit | '';
}
