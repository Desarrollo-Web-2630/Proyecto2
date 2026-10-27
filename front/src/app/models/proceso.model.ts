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

// Espejo de ProcesoDTO
export type ProcesoRequest = Pick<Proceso, 'nombre' | 'descripcion' | 'categoria'>;

export interface ProcesoFiltro {
  nombre?: string;
  estado?: EstadoProceso | '';
  categoria?: string;
  incluirInactivos?: boolean;
  page?: number;
  size?: number;
}

