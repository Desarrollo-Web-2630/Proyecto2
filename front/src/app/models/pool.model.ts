// PROPIETARIO es la empresa; los demás son externos
export type TipoPool = 'PROPIETARIO' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';

export interface Pool {
  id: number;
  nombre: string;
  tipo: TipoPool;
  procesoId: number;
}

export type PoolRequest = Omit<Pool, 'id' | 'procesoId'>;
