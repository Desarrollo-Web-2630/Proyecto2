import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Actividad } from '../../models/actividad.model';
import { Lane } from '../../models/lane.model';
import { Pool } from '../../models/pool.model';
import { RolProceso } from '../../models/rol-proceso.model';

export interface MovimientoActividad {
  actividad: Actividad;
  laneId: number;
  posicionX: number;
  posicionY: number;
}

// Diagrama de pools, lanes y lienzo 2D de actividades del proceso
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
  readonly roles = input<RolProceso[]>([]);
  readonly editable = input<boolean>(false);

  readonly moverActividad = output<MovimientoActividad>();
  readonly reordenarLanes = output<number[]>();

  protected readonly actividadArrastrada = signal<Actividad | null>(null);
  protected readonly laneArrastradaId = signal<number | null>(null);
  protected readonly laneActivaId = signal<number | null>(null);

  private offsetX = 0;
  private offsetY = 0;

  actividadesDe(laneId: number): Actividad[] {
    return this.actividades()
      .filter(a => a.laneId === laneId)
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
    return this.actividades().filter(a => !lanes.some(l => l.id === a.laneId));
  }

  iniciarArrastreActividad(event: DragEvent, actividad: Actividad): void {
    if (!this.editable()) {
      event.preventDefault();
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
    this.actividadArrastrada.set(actividad);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(actividad.id));
    }
  }

  permitirSoltarActividad(event: DragEvent, laneId: number): void {
    if (!this.editable() || !this.actividadArrastrada()) {
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

  iniciarArrastreLane(event: DragEvent, laneId: number): void {
    if (!this.editable() || this.lanes().length <= 1) {
      event.preventDefault();
      return;
    }
    this.actividadArrastrada.set(null);
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
    this.actividadArrastrada.set(null);
    this.laneArrastradaId.set(null);
    this.laneActivaId.set(null);
  }
}
