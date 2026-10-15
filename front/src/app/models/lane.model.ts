export interface Lane {
  id: number;
  nombre: string;
  orden: number;
  rolProcesoId: number;
  poolId: number;
}

export type LaneRequest = Omit<Lane, 'id' | 'orden' | 'poolId'>;
