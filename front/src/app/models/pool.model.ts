// PROPIETARIO es la empresa dueña del proceso; los demás son participantes externos (caja negra)
export type TipoPool = 'PROPIETARIO' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';

export interface Pool {
  id: number;
  nombre: string;
  tipo: TipoPool;
  procesoId: number;
}

export type PoolRequest = Omit<Pool, 'id' | 'procesoId'>;
