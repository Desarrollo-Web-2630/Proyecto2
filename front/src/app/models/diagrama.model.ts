import { Actividad } from './actividad.model';
import { Arco } from './arco.model';

// Eventos y estructuras del diagrama de pools y lanes

export interface MovimientoActividad {
  actividad: Actividad;
  laneId: number;
  posicionX: number;
  posicionY: number;
}

export interface NuevoArcoDiagrama {
  origenId: number;
  destinoId: number;
}

export interface EdicionArcoDiagrama {
  arco: Arco;
  nombre: string | null;
}

export interface ArcoVisual {
  arco: Arco;
  path: string;
  labelX: number;
  labelY: number;
  etiqueta: string;
}
