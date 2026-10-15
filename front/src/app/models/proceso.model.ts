export type EstadoProceso = 'BORRADOR' | 'PUBLICADO' | 'INACTIVO';

// Espejo de ProcesoRespuestaDTO
export interface Proceso {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  empresaId: number;
}
