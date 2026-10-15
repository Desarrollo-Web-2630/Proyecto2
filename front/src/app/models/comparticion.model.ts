// Empresas con las que se comparte un proceso en solo lectura
export interface Comparticion {
  compartido: boolean;
  empresasIds: number[];
}
