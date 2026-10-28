export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';

// Espejo de GatewayRespuestaDTO
export interface Gateway {
  id: number;
  nombre: string;
  tipo: TipoGateway;
  procesoId: number;
}

export type GatewayRequest = Pick<Gateway, 'nombre' | 'tipo'>;
