import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { RolAcceso, Usuario } from '../../models/usuario.model';
import { SesionService } from '../../services/sesion.service';
import { UsuarioService } from '../../services/usuario.service';

// HU-02
@Component({
  selector: 'app-usuario-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './usuario-list.component.html'
})
export class UsuarioListComponent implements OnInit {
  private readonly service = inject(UsuarioService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly sesion = inject(SesionService);

  protected readonly roles: RolAcceso[] = ['ADMIN', 'EDITOR', 'LECTURA'];
  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly message = signal('');
  protected readonly actionError = signal('');

  private readonly tamano = 10;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.service.buscar(this.pagina(), this.tamano)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.usuarios.set(page.content);
          this.totalPaginas.set(page.totalPages);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los usuarios'));
          this.status.set('error');
        }
      });
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.load();
  }

  puedeModificar(usuario: Usuario): boolean {
    return this.sesion.esAdmin() && usuario.id !== this.sesion.usuario()?.id;
  }

  cambiarRol(usuario: Usuario, rol: string): void {
    this.actionError.set('');
    this.service.cambiarRol(usuario.id, rol as RolAcceso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: actualizado => this.usuarios.update(lista => lista.map(u => u.id === actualizado.id ? actualizado : u)),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible cambiar el rol'))
      });
  }

  desactivar(usuario: Usuario): void {
    if (!confirm(`¿Desactivar a ${usuario.nombre}? Sus procesos siguen siendo de la empresa.`)) {
      return;
    }
    this.actionError.set('');
    this.service.desactivar(usuario.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: actualizado => this.usuarios.update(lista => lista.map(u => u.id === actualizado.id ? actualizado : u)),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible desactivar el usuario'))
      });
  }
}
