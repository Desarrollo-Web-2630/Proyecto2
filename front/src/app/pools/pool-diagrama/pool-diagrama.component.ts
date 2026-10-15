import { Component, Input } from '@angular/core';
import { Actividad } from '../../models/actividad.model';
import { Lane } from '../../models/lane.model';
import { Pool } from '../../models/pool.model';
import { RolProceso } from '../../models/rol-proceso.model';

// Dibuja los pools del proceso: el de la empresa con sus lanes y los externos como caja negra
@Component({
  selector: 'app-pool-diagrama',
  templateUrl: './pool-diagrama.component.html',
  styleUrl: './pool-diagrama.component.css'
})
export class PoolDiagramaComponent {
  @Input({ required: true }) pools: Pool[] = [];
  @Input() lanes: Lane[] = [];
  @Input() actividades: Actividad[] = [];
  @Input() roles: RolProceso[] = [];

  actividadesDe(laneId: number): Actividad[] {
    return this.actividades
      .filter(a => a.laneId === laneId)
      .sort((a, b) => a.posicionX - b.posicionX);
  }

  nombreRol(rolId: number): string {
    return this.roles.find(r => r.id === rolId)?.nombre ?? 'Sin rol';
  }

  // Actividades cuya lane no existe: es un error de modelado
  actividadesSinLane(): Actividad[] {
    return this.actividades.filter(a => !this.lanes.some(l => l.id === a.laneId));
  }
}
