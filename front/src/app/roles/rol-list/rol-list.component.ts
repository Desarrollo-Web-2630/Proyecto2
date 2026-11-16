import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { RolProceso } from '../../models/rol-proceso.model';
import { RolProcesoService } from '../../services/rol-proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-19 y HU-20
@Component({
  selector: 'app-rol-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './rol-list.component.html'
})
export class RolListComponent implements OnInit {
  private readonly service = inject(RolProcesoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly sesion = inject(SesionService);

  private readonly tamano = 10;

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly message = signal('');
  protected readonly actionError = signal('');
  protected nombre = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.service.buscar(this.nombre.trim(), this.pagina(), this.tamano)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.roles.set(page.content);
          this.totalPaginas.set(page.totalPages);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los roles'));
          this.status.set('error');
        }
      });
  }

  buscar(): void {
    this.pagina.set(0);
    this.load();
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.load();
  }

  // HU-19: un rol en uso no se elimina
  remove(rol: RolProceso): void {
    this.actionError.set('');
    if (!rol.eliminable) {
      const procesos = rol.procesosEnUso.map(p => p.nombre).join(', ');
      this.actionError.set(`No se puede eliminar ${rol.nombre}: está en uso en ${procesos}`);
      return;
    }
    if (!confirm(`¿Eliminar el rol ${rol.nombre}?`)) {
      return;
    }
    this.service.delete(rol.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible eliminar el rol'))
      });
  }
}
