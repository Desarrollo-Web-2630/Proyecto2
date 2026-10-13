import { RolAcceso } from './usuario.model';

export type TipoPool = 'PROPIETARIO' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';

export const TIPOS_POOL: readonly TipoPool[] = ['PROPIETARIO', 'CLIENTE', 'PROVEEDOR', 'SISTEMA_EXTERNO'];

export const ETIQUETA_TIPO_POOL: Record<TipoPool, string> = {
  PROPIETARIO: 'Empresa propietaria',
  CLIENTE: 'Cliente',
  PROVEEDOR: 'Proveedor',
  SISTEMA_EXTERNO: 'Sistema externo',
};

export function esCajaNegra(tipo: TipoPool): boolean {
  return tipo !== 'PROPIETARIO';
}

export interface Pool {
  id: number;
  nombre: string;
  tipo: TipoPool;
  procesoId: number;
}

export interface PoolRequest {
  nombre: string;
  tipo: TipoPool;
}

export interface Lane {
  id: number;
  nombre: string;
  orden: number;
  rolProcesoId: number;
  poolId: number;
}

export interface LaneRequest {
  nombre: string;
  rolProcesoId: number;
}

export interface RolProceso {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Comparticion {
  compartido: boolean;
  empresasIds: number[];
}

// HU-24
export type AccionPool = 'crear' | 'editar' | 'eliminar';

export const ACCIONES_POOL: readonly AccionPool[] = ['crear', 'editar', 'eliminar'];

export type PermisosPool = Record<AccionPool, RolAcceso[]>;

// Valores por defecto mientras el admin no configure
export const PERMISOS_POOL_POR_DEFECTO: PermisosPool = {
  crear: ['ADMIN', 'EDITOR'],
  editar: ['ADMIN', 'EDITOR'],
  eliminar: ['ADMIN', 'EDITOR'],
};
