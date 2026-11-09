import { Actividad } from './actividad.model';
import { Gateway } from './gateway.model';

// Tipos que intercambian el editor del proceso y el lienzo (paleta, selección y eventos de arrastre)

export type ClavePaleta =
  | 'POOL_PROPIETARIO'
  | 'POOL_CLIENTE'
  | 'POOL_PROVEEDOR'
  | 'POOL_SISTEMA_EXTERNO'
  | 'LANE'
  | 'ACTIVIDAD'
  | 'GATEWAY_EXCLUSIVO'
  | 'GATEWAY_PARALELO'
  | 'GATEWAY_INCLUSIVO';

export type TipoSeleccion = 'actividad' | 'gateway' | 'arco' | 'mensaje' | 'lane' | 'pool';

export interface Seleccion {
  tipo: TipoSeleccion;
  id: number;
}

export interface SoltarPaleta {
  clave: ClavePaleta;
  laneId: number | null;
  x: number;
  y: number;
}

export interface MoverActividad {
  actividad: Actividad;
  laneId: number;
  x: number;
  y: number;
}

export interface MoverGateway {
  gateway: Gateway;
  x: number;
  y: number;
}

export interface CrearArco {
  origenId: number;
  destinoId: number;
}

export interface CrearMensaje {
  origenId: number;
  poolDestinoId: number;
}
