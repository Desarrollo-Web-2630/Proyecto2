// Espejo de ActividadRespuestaDTO
export interface Actividad {
  id: number;
  nombre: string;
  tipoActividad: string;
  laneId: number;
  posicionX: number;
  posicionY: number;
  procesoId: number;
}

// Espejo de ActividadDTO
export type ActividadRequest = Omit<Actividad, 'id' | 'procesoId'>;
