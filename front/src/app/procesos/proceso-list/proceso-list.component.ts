import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { EstadoProceso, Proceso } from '../../models/proceso.model';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-05, HU-06 y HU-07
@Component({
  selector: 'app-proceso-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './proceso-list.component.html'
})
export class ProcesoListComponent implements OnInit {
  private readonly service = inject(ProcesoService);
  protected readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly tamano = 10;

  protected readonly estados: EstadoProceso[] = ['BORRADOR', 'PUBLICADO', 'INACTIVO'];
  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly procesos = signal<Proceso[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly message = signal('');
  protected readonly actionError = signal('');

  protected nombre = '';
  protected categoria = '';
  protected estado: EstadoProceso | '' = '';
  protected incluirInactivos = false;

  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.service.buscar({
      nombre: this.nombre.trim(),
      categoria: this.categoria.trim(),
      estado: this.estado,
      incluirInactivos: this.incluirInactivos,
      page: this.pagina(),
      size: this.tamano
    })
        .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          if (page.content.length === 0 && this.pagina() > 0 && page.totalPages > 0) {
            this.pagina.set(page.totalPages - 1);
            this.load();
            return;
          }
          this.procesos.set(page.content);
          this.totalPaginas.set(page.totalPages);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los procesos'));
          this.status.set('error');
        }
      });
  }

  buscar(): void {
    this.pagina.set(0);
    this.load();
  }

  limpiar(): void {
    this.nombre = '';
    this.categoria = '';
    this.estado = '';
    this.incluirInactivos = false;
    this.pagina.set(0);
    this.load();
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.load();
  }

  // HU-05: pasar el proceso a publicado
  publicar(proceso: Proceso): void {
    this.actionError.set('');
    this.service.publicar(proceso.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible publicar el proceso'))
      });
  }

  // HU-06: inactivar y reactivar proceso
  inactivar(proceso: Proceso): void {
    if (!confirm(`¿Inactivar el proceso ${proceso.nombre}?`)) {
      return;
    }
    this.actionError.set('');
    this.service.inactivar(proceso.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible inactivar el proceso'))
      });
  }

  reactivar(proceso: Proceso): void {
    this.actionError.set('');
    this.service.reactivar(proceso.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible reactivar el proceso'))
      });
  }

  // HU-06: eliminar proceso (borrado lógico)
  remove(proceso: Proceso): void {
    if (!confirm(`¿Eliminar el proceso ${proceso.nombre}?`)) {
      return;
    }
    this.actionError.set('');
    this.service.delete(proceso.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible eliminar el proceso'))
      });
  }
}

