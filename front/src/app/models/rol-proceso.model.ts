// Espejo de ProcesoUsoDTO
export interface ProcesoUso {
  id: number;
  nombre: string;
}

// Espejo de RolProcesoRespuestaDTO
export interface RolProceso {
  id: number;
  nombre: string;
  descripcion: string;
  procesosEnUso: ProcesoUso[];
  eliminable: boolean;
}

// Espejo de RolProcesoRequestDTO
export type RolProcesoRequest = Pick<RolProceso, 'nombre' | 'descripcion'>;
