export type EstadoProceso = 'BORRADOR' | 'PUBLICADO' | 'INACTIVO';

export interface Proceso {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  empresaId: number;
}

export interface Actividad {
  id: number;
  nombre: string;
  tipoActividad: string;
  laneId: number;
  posicionX: number;
  posicionY: number;
  procesoId: number;
}
