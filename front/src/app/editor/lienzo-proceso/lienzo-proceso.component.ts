import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Actividad } from '../../models/actividad.model';
import { Arco } from '../../models/arco.model';
import { Gateway, TipoGateway } from '../../models/gateway.model';
import { Lane } from '../../models/lane.model';
import { Mensaje } from '../../models/mensaje.model';
import { Pool } from '../../models/pool.model';
import { RolProceso } from '../../models/rol-proceso.model';

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

interface Punto {
  x: number;
  y: number;
}

interface Nodo {
  id: number;
  tipo: 'actividad' | 'gateway';
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

interface TrazoVisual {
  clave: string;
  id: number;
  path: string;
  etiqueta: string;
  etiquetaX: number;
  etiquetaY: number;
}

type Arrastre =
  | { tipo: 'actividad'; actividad: Actividad; dx: number; dy: number }
  | { tipo: 'gateway'; gateway: Gateway; dx: number; dy: number }
  | { tipo: 'conector'; origen: Nodo }
  | { tipo: 'lane'; laneId: number };

type Accion =
  | { tipo: 'paleta'; datos: SoltarPaleta }
  | { tipo: 'mover-actividad'; datos: MoverActividad }
  | { tipo: 'mover-gateway'; datos: MoverGateway }
  | { tipo: 'arco'; datos: CrearArco }
  | { tipo: 'mensaje'; datos: CrearMensaje }
  | { tipo: 'orden-lanes'; ids: number[]; laneId: number };

const ANCHO_ACTIVIDAD = 140;
const ALTO_ACTIVIDAD = 52;
const LADO_GATEWAY = 56;
const DESPLAZAMIENTO_X = 180;
const ALTO_MINIMO_LANE = 130;
const ALTO_EXTERNO = 56;
const ANCHO_EXTERNO = 420;
const SEPARACION = 32;

// Lienzo del proceso: pools, lanes, actividades, gateways, arcos y mensajes
@Component({
  selector: 'app-lienzo-proceso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lienzo-proceso.component.html',
  styleUrl: './lienzo-proceso.component.css'
})
export class LienzoProcesoComponent {
  readonly pools = input.required<Pool[]>();
  readonly lanes = input<Lane[]>([]);
  readonly actividades = input<Actividad[]>([]);
  readonly gateways = input<Gateway[]>([]);
  readonly arcos = input<Arco[]>([]);
  readonly mensajes = input<Mensaje[]>([]);
  readonly roles = input<RolProceso[]>([]);
  readonly editable = input(false);
  readonly seleccion = input<Seleccion | null>(null);
  readonly itemPaleta = input<ClavePaleta | null>(null);

  readonly soltarPaleta = output<SoltarPaleta>();
  readonly moverActividad = output<MoverActividad>();
  readonly moverGateway = output<MoverGateway>();
  readonly reordenarLanes = output<number[]>();
  readonly crearArco = output<CrearArco>();
  readonly crearMensaje = output<CrearMensaje>();
  readonly seleccionar = output<Seleccion | null>();

  protected readonly arrastre = signal<Arrastre | null>(null);
  protected readonly puntero = signal<Punto | null>(null);
  protected readonly laneActivaId = signal<number | null>(null);
  protected readonly nodoDestinoId = signal<number | null>(null);
  protected readonly externoActivoId = signal<number | null>(null);
  protected readonly tableroActivo = signal(false);

  protected readonly propietario = computed(() => this.pools().find(p => p.tipo === 'PROPIETARIO') ?? null);
  protected readonly externos = computed(() => this.pools().filter(p => p.tipo !== 'PROPIETARIO'));

  protected readonly alturasLane = computed(() => {
    const mapa = new Map<number, number>();
    for (const lane of this.lanes()) {
      const ys = this.actividades().filter(a => a.laneId === lane.id).map(a => a.posicionY);
      mapa.set(lane.id, ys.length === 0 ? ALTO_MINIMO_LANE : Math.max(ALTO_MINIMO_LANE, Math.max(...ys) + 72));
    }
    return mapa;
  });

  protected readonly desplazamientosLane = computed(() => {
    const mapa = new Map<number, number>();
    let acumulado = 0;
    for (const lane of this.lanes()) {
      mapa.set(lane.id, acumulado);
      acumulado += this.alturasLane().get(lane.id) ?? ALTO_MINIMO_LANE;
    }
    return mapa;
  });

  protected readonly alturaPropietario = computed(() => {
    if (!this.propietario()) {
      return 0;
    }
    const total = this.lanes().reduce((suma, lane) => suma + (this.alturasLane().get(lane.id) ?? 0), 0);
    return Math.max(total, ALTO_MINIMO_LANE);
  });

  protected readonly alturaTablero = computed(() => {
    const filas = this.externos().length + 1;
    return Math.max(320, this.alturaPropietario() + SEPARACION + filas * (ALTO_EXTERNO + SEPARACION));
  });

  protected readonly nodos = computed(() => {
    const mapa = new Map<number, Nodo>();
    for (const a of this.actividades()) {
      const desplazamiento = this.desplazamientosLane().get(a.laneId);
      if (desplazamiento !== undefined) {
        mapa.set(a.id, {
          id: a.id,
          tipo: 'actividad',
          x: a.posicionX,
          y: desplazamiento + a.posicionY,
          ancho: ANCHO_ACTIVIDAD,
          alto: ALTO_ACTIVIDAD
        });
      }
    }
    for (const g of this.gateways()) {
      mapa.set(g.id, {
        id: g.id,
        tipo: 'gateway',
        x: g.posicionX,
        y: g.posicionY,
        ancho: LADO_GATEWAY,
        alto: LADO_GATEWAY
      });
    }
    return mapa;
  });

  protected readonly arcosVisuales = computed<TrazoVisual[]>(() => {
    const resultado: TrazoVisual[] = [];
    for (const arco of this.arcos()) {
      const origen = this.nodos().get(Number(arco.origenId));
      const destino = this.nodos().get(Number(arco.destinoId));
      if (!origen || !destino) {
        continue;
      }
      const trazo = this.trazoEntre(origen, destino);
      const partes = [arco.nombre?.trim(), arco.condicion ? `[${arco.condicion.trim()}]` : ''].filter(Boolean);
      resultado.push({
        clave: `arco-${arco.id}`,
        id: arco.id,
        path: trazo.path,
        etiqueta: partes.join(' '),
        etiquetaX: trazo.x,
        etiquetaY: trazo.y
      });
    }
    return resultado;
  });

  protected readonly mensajesVisuales = computed<TrazoVisual[]>(() => {
    const resultado: TrazoVisual[] = [];
    const propietario = this.propietario();
    if (!propietario) {
      return resultado;
    }
    const usados = new Map<string, number>();
    for (const m of this.mensajes()) {
      const saliente = m.poolOrigenId === propietario.id;
      const externoId = saliente ? m.poolDestinoId : m.poolOrigenId;
      const indice = this.externos().findIndex(p => p.id === externoId);
      if (indice === -1 || (!saliente && m.poolDestinoId !== propietario.id)) {
        continue;
      }
      const nodo = m.elementoOrigenId === null ? undefined : this.nodos().get(m.elementoOrigenId);
      const claveUso = `${externoId}-${nodo?.id ?? 0}-${saliente}`;
      const repeticion = usados.get(claveUso) ?? 0;
      usados.set(claveUso, repeticion + 1);
      const x = (nodo ? nodo.x + nodo.ancho / 2 : 120 + indice * 60) + repeticion * 18;
      const yPropietario = this.alturaPropietario();
      const yExterno = this.yExterno(indice);
      const yInicioSaliente = nodo ? nodo.y + nodo.alto : yPropietario;
      const y1 = saliente ? yInicioSaliente : yExterno;
      const y2 = saliente ? yExterno : yPropietario;
      const partes = [m.nombre, `[${m.claveCorrelacion}]`];
      resultado.push({
        clave: `mensaje-${m.id}`,
        id: m.id,
        path: `M ${x} ${y1} L ${x} ${y2}`,
        etiqueta: partes.join(' '),
        etiquetaX: x + 6,
        etiquetaY: Math.round((yPropietario + yExterno) / 2)
      });
    }
    return resultado;
  });

  protected readonly trazoEnCurso = computed<string | null>(() => {
    const actual = this.arrastre();
    const p = this.puntero();
    if (!actual || actual.tipo !== 'conector' || !p) {
      return null;
    }
    const x1 = actual.origen.x + actual.origen.ancho;
    const y1 = actual.origen.y + actual.origen.alto / 2;
    const delta = Math.max(30, Math.abs(p.x - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + delta} ${y1}, ${p.x - delta} ${p.y}, ${p.x} ${p.y}`;
  });

  protected readonly desplazamiento = DESPLAZAMIENTO_X;

  protected readonly anchoTablero = computed(() => {
    const derechas = [...this.nodos().values()].map(n => n.x + n.ancho);
    return DESPLAZAMIENTO_X + Math.max(760, ...derechas.map(d => d + 140));
  });

  topActividad(a: Actividad): number {
    return (this.desplazamientosLane().get(a.laneId) ?? 0) + a.posicionY;
  }

  topLane(laneId: number): number {
    return this.desplazamientosLane().get(laneId) ?? 0;
  }

  alturaLane(laneId: number): number {
    return this.alturasLane().get(laneId) ?? ALTO_MINIMO_LANE;
  }

  yExterno(indice: number): number {
    return this.alturaPropietario() + SEPARACION + indice * (ALTO_EXTERNO + SEPARACION);
  }

  nombreRol(rolId: number): string {
    return this.roles().find(r => r.id === rolId)?.nombre ?? 'Sin rol';
  }

  simboloGateway(tipo: TipoGateway): string {
    return tipo === 'EXCLUSIVO' ? '×' : tipo === 'PARALELO' ? '+' : '○';
  }

  esSeleccion(tipo: TipoSeleccion, id: number): boolean {
    const actual = this.seleccion();
    return actual?.tipo === tipo && actual.id === id;
  }

  elegir(event: Event, tipo: TipoSeleccion, id: number): void {
    event.stopPropagation();
    this.seleccionar.emit({ tipo, id });
  }

  limpiarSeleccion(): void {
    this.seleccionar.emit(null);
  }

  // Arrastre de elementos existentes

  iniciarActividad(event: DragEvent, actividad: Actividad): void {
    if (!this.editable()) {
      event.preventDefault();
      return;
    }
    const caja = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.arrastre.set({ tipo: 'actividad', actividad, dx: event.clientX - caja.left, dy: event.clientY - caja.top });
    this.prepararTransferencia(event, String(actividad.id));
  }

  iniciarGateway(event: DragEvent, gateway: Gateway): void {
    if (!this.editable()) {
      event.preventDefault();
      return;
    }
    const caja = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.arrastre.set({ tipo: 'gateway', gateway, dx: event.clientX - caja.left, dy: event.clientY - caja.top });
    this.prepararTransferencia(event, String(gateway.id));
  }

  iniciarConector(event: DragEvent, id: number): void {
    const origen = this.nodos().get(id);
    event.stopPropagation();
    if (!this.editable() || !origen) {
      event.preventDefault();
      return;
    }
    this.arrastre.set({ tipo: 'conector', origen });
    this.prepararTransferencia(event, String(id));
  }

  iniciarLane(event: DragEvent, laneId: number): void {
    if (!this.editable() || this.lanes().length < 2) {
      event.preventDefault();
      return;
    }
    this.arrastre.set({ tipo: 'lane', laneId });
    this.prepararTransferencia(event, String(laneId));
  }

  finalizarArrastre(): void {
    this.arrastre.set(null);
    this.puntero.set(null);
    this.laneActivaId.set(null);
    this.nodoDestinoId.set(null);
    this.externoActivoId.set(null);
    this.tableroActivo.set(false);
  }

  // El tablero decide qué pasa según la posición del cursor

  sobreTablero(event: DragEvent): void {
    if (!this.editable()) {
      return;
    }
    const punto = this.puntoDe(event);
    const accion = this.accionEn(punto);
    this.puntero.set(punto);
    this.marcarObjetivo(accion);
    if (accion) {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  salirDelTablero(event: DragEvent): void {
    const tablero = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && tablero.contains(event.relatedTarget)) {
      return;
    }
    this.marcarObjetivo(null);
    this.puntero.set(null);
  }

  soltarEnTablero(event: DragEvent): void {
    if (!this.editable()) {
      return;
    }
    const accion = this.accionEn(this.puntoDe(event));
    this.finalizarArrastre();
    if (!accion) {
      return;
    }
    event.preventDefault();
    switch (accion.tipo) {
      case 'paleta':
        this.soltarPaleta.emit(accion.datos);
        break;
      case 'mover-actividad':
        this.moverActividad.emit(accion.datos);
        break;
      case 'mover-gateway':
        this.moverGateway.emit(accion.datos);
        break;
      case 'arco':
        this.crearArco.emit(accion.datos);
        break;
      case 'mensaje':
        this.crearMensaje.emit(accion.datos);
        break;
      case 'orden-lanes':
        this.reordenarLanes.emit(accion.ids);
        break;
    }
  }

  private prepararTransferencia(event: DragEvent, valor: string): void {
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', valor);
    }
  }

  private puntoDe(event: DragEvent): Punto {
    const caja = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: event.clientX - caja.left - DESPLAZAMIENTO_X, y: event.clientY - caja.top };
  }

  private laneEn(y: number): Lane | null {
    if (!this.propietario()) {
      return null;
    }
    for (const lane of this.lanes()) {
      const inicio = this.desplazamientosLane().get(lane.id) ?? 0;
      if (y >= inicio && y < inicio + this.alturaLane(lane.id)) {
        return lane;
      }
    }
    return null;
  }

  private externoEn(p: Punto): Pool | null {
    if (p.x < -DESPLAZAMIENTO_X || p.x > ANCHO_EXTERNO - DESPLAZAMIENTO_X) {
      return null;
    }
    const indice = this.externos().findIndex(
      (_, i) => p.y >= this.yExterno(i) && p.y <= this.yExterno(i) + ALTO_EXTERNO
    );
    return indice === -1 ? null : this.externos()[indice];
  }

  private nodoEn(p: Punto, excluirId: number): Nodo | null {
    const margen = 6;
    for (const nodo of this.nodos().values()) {
      if (
        nodo.id !== excluirId &&
        p.x >= nodo.x - margen &&
        p.x <= nodo.x + nodo.ancho + margen &&
        p.y >= nodo.y - margen &&
        p.y <= nodo.y + nodo.alto + margen
      ) {
        return nodo;
      }
    }
    return null;
  }

  private accionEn(p: Punto): Accion | null {
    const clave = this.itemPaleta();
    if (clave) {
      return this.accionPaleta(clave, p);
    }
    const actual = this.arrastre();
    if (!actual) {
      return null;
    }
    switch (actual.tipo) {
      case 'actividad': {
        const lane = this.laneEn(p.y);
        if (!lane || p.x < 0) {
          return null;
        }
        const desplazamiento = this.desplazamientosLane().get(lane.id) ?? 0;
        return {
          tipo: 'mover-actividad',
          datos: {
            actividad: actual.actividad,
            laneId: lane.id,
            x: Math.max(0, Math.round(p.x - actual.dx)),
            y: Math.max(0, Math.round(p.y - desplazamiento - actual.dy))
          }
        };
      }
      case 'gateway': {
        if (!this.laneEn(p.y) || p.x < 0) {
          return null;
        }
        return {
          tipo: 'mover-gateway',
          datos: { gateway: actual.gateway, x: this.limitarX(p.x - actual.dx), y: this.limitarY(p.y - actual.dy) }
        };
      }
      case 'conector': {
        const destino = this.nodoEn(p, actual.origen.id);
        if (destino) {
          return { tipo: 'arco', datos: { origenId: actual.origen.id, destinoId: destino.id } };
        }
        const externo = this.externoEn(p);
        if (externo && actual.origen.tipo === 'actividad') {
          return { tipo: 'mensaje', datos: { origenId: actual.origen.id, poolDestinoId: externo.id } };
        }
        return null;
      }
      case 'lane': {
        const destino = this.laneEn(p.y);
        if (!destino || destino.id === actual.laneId) {
          return null;
        }
        const ids = this.lanes().map(l => l.id);
        ids.splice(ids.indexOf(actual.laneId), 1);
        ids.splice(this.lanes().findIndex(l => l.id === destino.id), 0, actual.laneId);
        return { tipo: 'orden-lanes', ids, laneId: destino.id };
      }
    }
  }

  private accionPaleta(clave: ClavePaleta, p: Punto): Accion | null {
    if (clave.startsWith('POOL_')) {
      return clave === 'POOL_PROPIETARIO' && this.propietario()
        ? null
        : { tipo: 'paleta', datos: { clave, laneId: null, x: 0, y: 0 } };
    }
    if (clave === 'LANE') {
      return this.propietario() ? { tipo: 'paleta', datos: { clave, laneId: null, x: 0, y: 0 } } : null;
    }
    const lane = this.laneEn(p.y);
    if (!lane || p.x < 0) {
      return null;
    }
    if (clave === 'ACTIVIDAD') {
      const desplazamiento = this.desplazamientosLane().get(lane.id) ?? 0;
      return {
        tipo: 'paleta',
        datos: {
          clave,
          laneId: lane.id,
          x: Math.max(0, Math.round(p.x - ANCHO_ACTIVIDAD / 2)),
          y: Math.max(0, Math.round(p.y - desplazamiento - ALTO_ACTIVIDAD / 2))
        }
      };
    }
    return {
      tipo: 'paleta',
      datos: { clave, laneId: lane.id, x: this.limitarX(p.x - LADO_GATEWAY / 2), y: this.limitarY(p.y - LADO_GATEWAY / 2) }
    };
  }

  private limitarX(x: number): number {
    return Math.max(0, Math.round(x));
  }

  private limitarY(y: number): number {
    return Math.max(0, Math.min(Math.round(y), this.alturaPropietario() - LADO_GATEWAY));
  }

  private marcarObjetivo(accion: Accion | null): void {
    this.tableroActivo.set(accion?.tipo === 'paleta' && accion.datos.laneId === null);
    this.laneActivaId.set(
      accion?.tipo === 'paleta' && accion.datos.laneId !== null
        ? accion.datos.laneId
        : accion?.tipo === 'mover-actividad'
          ? accion.datos.laneId
          : accion?.tipo === 'orden-lanes'
            ? accion.laneId
            : null
    );
    this.nodoDestinoId.set(accion?.tipo === 'arco' ? accion.datos.destinoId : null);
    this.externoActivoId.set(accion?.tipo === 'mensaje' ? accion.datos.poolDestinoId : null);
  }

  private trazoEntre(origen: Nodo, destino: Nodo): { path: string; x: number; y: number } {
    const centroOrigenX = origen.x + origen.ancho / 2;
    const centroOrigenY = origen.y + origen.alto / 2;
    const centroDestinoX = destino.x + destino.ancho / 2;
    const centroDestinoY = destino.y + destino.alto / 2;
    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;
    let c1x: number;
    let c1y: number;
    let c2x: number;
    let c2y: number;

    if (origen.x + origen.ancho + 12 <= destino.x) {
      x1 = origen.x + origen.ancho;
      y1 = centroOrigenY;
      x2 = destino.x;
      y2 = centroDestinoY;
      const delta = Math.max(40, (x2 - x1) / 2);
      [c1x, c1y, c2x, c2y] = [x1 + delta, y1, x2 - delta, y2];
    } else if (destino.x + destino.ancho + 12 <= origen.x) {
      x1 = origen.x;
      y1 = centroOrigenY;
      x2 = destino.x + destino.ancho;
      y2 = centroDestinoY;
      const delta = Math.max(40, (x1 - x2) / 2);
      [c1x, c1y, c2x, c2y] = [x1 - delta, y1, x2 + delta, y2];
    } else if (centroOrigenY <= centroDestinoY) {
      x1 = centroOrigenX;
      y1 = origen.y + origen.alto;
      x2 = centroDestinoX;
      y2 = destino.y;
      const delta = Math.max(36, (y2 - y1) / 2);
      [c1x, c1y, c2x, c2y] = [x1, y1 + delta, x2, y2 - delta];
    } else {
      x1 = centroOrigenX;
      y1 = origen.y;
      x2 = centroDestinoX;
      y2 = destino.y + destino.alto;
      const delta = Math.max(36, (y1 - y2) / 2);
      [c1x, c1y, c2x, c2y] = [x1, y1 - delta, x2, y2 + delta];
    }
    return {
      path: `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`,
      x: Math.round((x1 + x2) / 2),
      y: Math.round((y1 + y2) / 2 - 8)
    };
  }
}
