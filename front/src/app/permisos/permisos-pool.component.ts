import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensajeDeError } from '../core/api-error';
import { PermisoPool } from '../models/permiso-pool.model';
import { PermisoPoolService } from '../services/permiso-pool.service';
import { SesionService } from '../services/sesion.service';

type CampoPermiso = 'puedeCrear' | 'puedeEditar' | 'puedeEliminar';

@Component({
  selector: 'app-permisos-pool',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './permisos-pool.component.html'
})
export class PermisosPoolComponent implements OnInit {
  private readonly service = inject(PermisoPoolService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();
  readonly poolId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly permisos = signal<PermisoPool[]>([]);
  protected readonly message = signal('');
  protected readonly aviso = signal('');
  protected readonly error = signal('');
  protected readonly guardando = signal(false);
  protected readonly puedeEditar = computed(() => this.sesion.esAdmin());

  private get id(): number {
    return Number(this.procesoId());
  }

  private get idPool(): number {
    return Number(this.poolId());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.service
      .list(this.id, this.idPool)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: permisos => {
          this.permisos.set(permisos);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los permisos del pool'));
          this.status.set('error');
        }
      });
  }

  alternar(permiso: PermisoPool, campo: CampoPermiso, marcado: boolean): void {
    if (!this.puedeEditar()) {
      return;
    }
    const actualizado: PermisoPool = { ...permiso };
    switch (campo) {
      case 'puedeCrear':
        actualizado.puedeCrear = marcado;
        break;
      case 'puedeEditar':
        actualizado.puedeEditar = marcado;
        break;
      case 'puedeEliminar':
        actualizado.puedeEliminar = marcado;
        break;
    }
    this.permisos.update(lista =>
      lista.map(p => (p.rolAcceso === permiso.rolAcceso ? actualizado : p))
    );
  }

  guardar(): void {
    if (!this.puedeEditar() || this.permisos().length === 0) {
      return;
    }
    this.aviso.set('');
    this.error.set('');
    this.guardando.set(true);
    forkJoin(this.permisos().map(p => this.service.update(this.id, this.idPool, p)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.aviso.set('Permisos actualizados');
          this.load();
        },
        error: err => {
          this.guardando.set(false);
          this.error.set(mensajeDeError(err, 'No fue posible guardar los permisos'));
        }
      });
  }
}
