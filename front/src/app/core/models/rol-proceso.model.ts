import { RolProceso } from './pool.model';

// Proceso en el que está usado un rol (HU-19 y HU-20)
export interface ProcesoUso {
  id: number;
  nombre: string;
}

// Un rol de proceso con su uso: es lo que devuelve /v1/roles-proceso
export interface RolProcesoDetalle extends RolProceso {
  procesosEnUso: ProcesoUso[];
  eliminable: boolean;
}

export interface RolProcesoRequest {
  nombre: string;
  descripcion: string;
}
