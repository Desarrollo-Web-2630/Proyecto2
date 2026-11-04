export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';

// Espejo de GatewayRespuestaDTO
export interface Gateway {
  id: number;
  nombre: string;
  tipo: TipoGateway;
  posicionX: number;
  posicionY: number;
  procesoId: number;
}

export interface GatewayRequest {
  nombre: string;
  tipo: TipoGateway;
  posicionX?: number;
  posicionY?: number;
}
