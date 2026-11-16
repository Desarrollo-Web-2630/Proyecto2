import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Actividad } from '../../models/actividad.model';
import { Arco } from '../../models/arco.model';
import { Lane } from '../../models/lane.model';
import { Pool } from '../../models/pool.model';
import { RolProceso } from '../../models/rol-proceso.model';

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

const ANCHO_TARJETA = 140;
const ALTO_TARJETA = 52;

// Diagrama de pools, lanes, lienzo 2D de actividades y capa SVG de arcos
@Component({
  selector: 'app-pool-diagrama',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pool-diagrama.component.html',
  styleUrl: './pool-diagrama.component.css'
})
export class PoolDiagramaComponent {
  readonly pools = input.required<Pool[]>();
  readonly lanes = input<Lane[]>([]);
  readonly actividades = input<Actividad[]>([]);
  readonly arcos = input<Arco[]>([]);
  readonly roles = input<RolProceso[]>([]);
  readonly editable = input<boolean>(false);

  readonly moverActividad = output<MovimientoActividad>();
  readonly reordenarLanes = output<number[]>();
  readonly crearArco = output<NuevoArcoDiagrama>();
  readonly editarArco = output<EdicionArcoDiagrama>();

  protected readonly actividadArrastrada = signal<Actividad | null>(null);
  protected readonly laneArrastradaId = signal<number | null>(null);
  protected readonly laneActivaId = signal<number | null>(null);
  protected readonly origenArco = signal<Actividad | null>(null);
  protected readonly actividadDestinoId = signal<number | null>(null);
  protected readonly punteroArco = signal<{ x: number; y: number } | null>(null);

  private offsetX = 0;
  private offsetY = 0;
  private desdeConector = false;

  protected readonly alturaTotalLanes = computed<number>(() =>
    this.lanes().reduce((total, lane) => total + this.alturaLane(lane.id), 0)
  );

  protected readonly arcosVisuales = computed<ArcoVisual[]>(() => {
    const lanes = this.lanes();
    const actividades = this.actividades();
    const arcos = this.arcos();
    if (lanes.length === 0 || actividades.length === 0 || arcos.length === 0) {
      return [];
    }

    const offsetVerticalLane = this.mapaOffsetVerticalLanes(lanes);
    const resultado: ArcoVisual[] = [];

    for (const arco of arcos) {
      const origen = actividades.find(a => Number(a.id) === Number(arco.origenId));
      const destino = actividades.find(a => Number(a.id) === Number(arco.destinoId));
      if (!origen || !destino) {
        continue;
      }
      const offsetOrigenY = offsetVerticalLane.get(Number(origen.laneId));
      const offsetDestinoY = offsetVerticalLane.get(Number(destino.laneId));
      if (offsetOrigenY === undefined || offsetDestinoY === undefined) {
        continue;
      }

      const trazo = this.calcularTrazo(
        origen.posicionX,
        offsetOrigenY + origen.posicionY,
        destino.posicionX,
        offsetDestinoY + destino.posicionY
      );
      const partes = [arco.nombre?.trim(), arco.condicion ? `[${arco.condicion.trim()}]` : ''].filter(
        Boolean
      );

      resultado.push({
        arco,
        path: trazo.path,
        labelX: trazo.labelX,
        labelY: trazo.labelY,
        etiqueta: partes.join(' ')
      });
    }
    return resultado;
  });

  protected readonly trazoArcoEnCurso = computed<string | null>(() => {
    const origen = this.origenArco();
    const puntero = this.punteroArco();
    if (!origen || !puntero) {
      return null;
    }
    const offsets = this.mapaOffsetVerticalLanes(this.lanes());
    const offsetOrigenY = offsets.get(Number(origen.laneId));
    if (offsetOrigenY === undefined) {
      return null;
    }
    const x1 = origen.posicionX + ANCHO_TARJETA;
    const y1 = offsetOrigenY + origen.posicionY + ALTO_TARJETA / 2;
    const x2 = puntero.x;
    const y2 = puntero.y;
    const deltaX = Math.max(30, Math.abs(x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
  });

  actividadesDe(laneId: number): Actividad[] {
    return this.actividades()
      .filter(a => Number(a.laneId) === Number(laneId))
      .sort((a, b) => a.posicionX - b.posicionX);
  }

  alturaLane(laneId: number): number {
    const lista = this.actividadesDe(laneId);
    if (lista.length === 0) {
      return 130;
    }
    const maxY = Math.max(...lista.map(a => a.posicionY));
    return Math.max(130, maxY + 72);
  }

  nombreRol(rolId: number): string {
    return this.roles().find(r => r.id === rolId)?.nombre ?? 'Sin rol';
  }

  // Actividades con una lane que no existe
  actividadesSinLane(): Actividad[] {
    const lanes = this.lanes();
    return this.actividades().filter(a => !lanes.some(l => Number(l.id) === Number(a.laneId)));
  }

  solicitarTextoArco(arco: Arco): void {
    if (!this.editable()) {
      return;
    }
    const actual = arco.nombre ?? '';
    const respuesta = prompt('Texto del arco (déjalo vacío para quitarlo):', actual);
    if (respuesta === null) {
      return;
    }
    const nuevoNombre = respuesta.trim() || null;
    if (nuevoNombre === (arco.nombre ?? null)) {
      return;
    }
    this.editarArco.emit({ arco, nombre: nuevoNombre });
  }

  prepararConector(event: MouseEvent): void {
    event.stopPropagation();
    this.desdeConector = true;
  }

  iniciarArrastreActividad(event: DragEvent, actividad: Actividad): void {
    if (!this.editable()) {
      event.preventDefault();
      return;
    }
    const target = event.target as HTMLElement | null;
    if (this.desdeConector || target?.closest('.conector-arco')) {
      this.iniciarConexionArco(event, actividad);
      return;
    }
    event.stopPropagation();
    const tarjeta = event.currentTarget as HTMLElement | null;
    if (tarjeta) {
      const rect = tarjeta.getBoundingClientRect();
      this.offsetX = event.clientX - rect.left;
      this.offsetY = event.clientY - rect.top;
    } else {
      this.offsetX = 40;
      this.offsetY = 20;
    }
    this.laneArrastradaId.set(null);
    this.origenArco.set(null);
    this.actividadArrastrada.set(actividad);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(actividad.id));
    }
  }

  permitirSoltarActividad(event: DragEvent, laneId: number): void {
    if (!this.editable()) {
      return;
    }
    if (this.origenArco()) {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      this.actualizarPunteroArco(event, laneId);
      return;
    }
    if (!this.actividadArrastrada()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.laneActivaId.set(laneId);
  }

  soltarActividad(event: DragEvent, laneId: number): void {
    const origen = this.origenArco();
    if (this.editable() && origen) {
      const destinoId = this.actividadDestinoId();
      if (destinoId !== null && destinoId !== origen.id) {
        event.preventDefault();
        event.stopPropagation();
        this.finalizarArrastre();
        this.crearArco.emit({ origenId: origen.id, destinoId });
        return;
      }
      this.finalizarArrastre();
      return;
    }

    const actividad = this.actividadArrastrada();
    if (!this.editable() || !actividad) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const lienzo = event.currentTarget as HTMLElement;
    const rect = lienzo.getBoundingClientRect();
    const maxX = Math.max(0, Math.floor(rect.width - 130));
    const posicionX = Math.max(
      0,
      Math.min(Math.round(event.clientX - rect.left - this.offsetX), maxX)
    );
    const posicionY = Math.max(0, Math.round(event.clientY - rect.top - this.offsetY));
    this.finalizarArrastre();
    this.moverActividad.emit({ actividad, laneId, posicionX, posicionY });
  }

  iniciarConexionArco(event: DragEvent, origen: Actividad): void {
    if (!this.editable()) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    this.desdeConector = false;
    this.actividadArrastrada.set(null);
    this.laneArrastradaId.set(null);
    this.origenArco.set(origen);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(origen.id));
    }
  }

  permitirSoltarArco(event: DragEvent, destino: Actividad): void {
    const origen = this.origenArco();
    if (!this.editable() || !origen || origen.id === destino.id) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.actividadDestinoId.set(destino.id);
    const offsets = this.mapaOffsetVerticalLanes(this.lanes());
    const offsetDestinoY = offsets.get(Number(destino.laneId)) ?? 0;
    this.punteroArco.set({
      x: destino.posicionX,
      y: offsetDestinoY + destino.posicionY + ALTO_TARJETA / 2
    });
  }

  soltarArco(event: DragEvent, destino: Actividad): void {
    const origen = this.origenArco();
    if (!this.editable() || !origen || origen.id === destino.id) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const origenId = origen.id;
    const destinoId = destino.id;
    this.finalizarArrastre();
    this.crearArco.emit({ origenId, destinoId });
  }

  salirDeActividad(event: DragEvent, actividadId: number): void {
    const tarjeta = event.currentTarget as HTMLElement | null;
    const relacionado = event.relatedTarget as Node | null;
    if (tarjeta && relacionado && tarjeta.contains(relacionado)) {
      return;
    }
    if (this.actividadDestinoId() === actividadId) {
      this.actividadDestinoId.set(null);
    }
  }

  iniciarArrastreLane(event: DragEvent, laneId: number): void {
    if (!this.editable() || this.lanes().length <= 1) {
      event.preventDefault();
      return;
    }
    this.actividadArrastrada.set(null);
    this.origenArco.set(null);
    this.laneArrastradaId.set(laneId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(laneId));
    }
  }

  permitirSoltarLane(event: DragEvent, laneId: number): void {
    if (!this.editable() || this.laneArrastradaId() === null) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.laneActivaId.set(laneId);
  }

  soltarLane(event: DragEvent, laneDestinoId: number): void {
    const origenId = this.laneArrastradaId();
    if (!this.editable() || origenId === null) {
      return;
    }
    event.preventDefault();
    if (origenId !== laneDestinoId) {
      const ids = this.lanes().map(l => l.id);
      const idxOrigen = ids.indexOf(origenId);
      const idxDestino = ids.indexOf(laneDestinoId);
      if (idxOrigen !== -1 && idxDestino !== -1) {
        ids.splice(idxOrigen, 1);
        ids.splice(idxDestino, 0, origenId);
        this.reordenarLanes.emit(ids);
      }
    }
    this.finalizarArrastre();
  }

  salirDeLane(laneId: number): void {
    if (this.laneActivaId() === laneId) {
      this.laneActivaId.set(null);
    }
  }

  finalizarArrastre(): void {
    this.desdeConector = false;
    this.actividadArrastrada.set(null);
    this.laneArrastradaId.set(null);
    this.laneActivaId.set(null);
    this.origenArco.set(null);
    this.actividadDestinoId.set(null);
    this.punteroArco.set(null);
  }

  private actualizarPunteroArco(event: DragEvent, laneId: number): void {
    const lienzo = event.currentTarget as HTMLElement | null;
    if (!lienzo) {
      return;
    }
    const rect = lienzo.getBoundingClientRect();
    const offsets = this.mapaOffsetVerticalLanes(this.lanes());
    const offsetLaneY = offsets.get(Number(laneId)) ?? 0;
    this.punteroArco.set({
      x: Math.max(0, Math.round(event.clientX - rect.left)),
      y: Math.max(0, Math.round(offsetLaneY + (event.clientY - rect.top)))
    });
  }

  private mapaOffsetVerticalLanes(lanes: Lane[]): Map<number, number> {
    const mapa = new Map<number, number>();
    let acumuladoY = 0;
    for (const lane of lanes) {
      mapa.set(Number(lane.id), acumuladoY);
      acumuladoY += this.alturaLane(lane.id);
    }
    return mapa;
  }

  private calcularTrazo(
    ox: number,
    oy: number,
    dx: number,
    dy: number
  ): { path: string; labelX: number; labelY: number } {
    const centroOx = ox + ANCHO_TARJETA / 2;
    const centroOy = oy + ALTO_TARJETA / 2;
    const centroDx = dx + ANCHO_TARJETA / 2;
    const centroDy = dy + ALTO_TARJETA / 2;

    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;
    let cx1: number;
    let cy1: number;
    let cx2: number;
    let cy2: number;

    if (ox + ANCHO_TARJETA + 12 <= dx) {
      x1 = ox + ANCHO_TARJETA;
      y1 = centroOy;
      x2 = dx;
      y2 = centroDy;
      const deltaX = Math.max(40, (x2 - x1) / 2);
      cx1 = x1 + deltaX;
      cy1 = y1;
      cx2 = x2 - deltaX;
      cy2 = y2;
    } else if (dx + ANCHO_TARJETA + 12 <= ox) {
      x1 = ox;
      y1 = centroOy;
      x2 = dx + ANCHO_TARJETA;
      y2 = centroDy;
      const deltaX = Math.max(40, (x1 - x2) / 2);
      cx1 = x1 - deltaX;
      cy1 = y1;
      cx2 = x2 + deltaX;
      cy2 = y2;
    } else if (centroOy <= centroDy) {
      x1 = centroOx;
      y1 = oy + ALTO_TARJETA;
      x2 = centroDx;
      y2 = dy;
      const deltaY = Math.max(36, (y2 - y1) / 2);
      cx1 = x1;
      cy1 = y1 + deltaY;
      cx2 = x2;
      cy2 = y2 - deltaY;
    } else {
      x1 = centroOx;
      y1 = oy;
      x2 = centroDx;
      y2 = dy + ALTO_TARJETA;
      const deltaY = Math.max(36, (y1 - y2) / 2);
      cx1 = x1;
      cy1 = y1 - deltaY;
      cx2 = x2;
      cy2 = y2 + deltaY;
    }

    return {
      path: `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`,
      labelX: Math.round((x1 + x2) / 2),
      labelY: Math.round((y1 + y2) / 2 - 8)
    };
  }
}
