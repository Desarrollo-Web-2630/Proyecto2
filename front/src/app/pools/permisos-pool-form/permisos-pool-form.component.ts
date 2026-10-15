import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { mensajeDeError } from '../../core/api-error';
import { PermisosPool } from '../../models/permisos-pool.model';
import { RolProceso } from '../../models/rol-proceso.model';
import { PermisosPoolService } from '../../services/permisos-pool.service';
import { RolProcesoService } from '../../services/rol-proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-24: el administrador decide si el editor puede modificar pools y lanes.
// El administrador siempre puede y solo lectura nunca.
@Component({
  selector: 'app-permisos-pool-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './permisos-pool-form.component.html'
})
export class PermisosPoolFormComponent implements OnInit {
  private readonly service = inject(PermisosPoolService);
  private readonly rolService = inject(RolProcesoService);
  protected readonly sesion = inject(SesionService);

  protected readonly acciones: { clave: keyof PermisosPool; texto: string }[] = [
    { clave: 'crear', texto: 'Crear pools y lanes' },
    { clave: 'editar', texto: 'Editar y reordenar' },
    { clave: 'eliminar', texto: 'Eliminar' }
  ];

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly permisos = signal<PermisosPool>({ crear: [], editar: [], eliminar: [] });
  protected readonly roles = signal<RolProceso[]>([]);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly guardado = signal('');

  ngOnInit(): void {
    Promise.all([this.service.get(), this.rolService.list()])
      .then(([permisos, roles]) => {
        this.permisos.set(permisos);
        this.roles.set(roles);
        this.status.set('success');
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar los permisos'));
        this.status.set('error');
      });
  }

  editorPuede(accion: keyof PermisosPool): boolean {
    return this.permisos()[accion].includes('EDITOR');
  }

  alternarEditor(accion: keyof PermisosPool): void {
    const actual = this.permisos();
    const roles = this.editorPuede(accion) ? actual[accion].filter(r => r !== 'EDITOR') : [...actual[accion], 'EDITOR' as const];
    this.permisos.set({ ...actual, [accion]: roles });
  }

  guardar(): void {
    // El administrador siempre queda incluido
    const datos: PermisosPool = {
      crear: this.editorPuede('crear') ? ['ADMIN', 'EDITOR'] : ['ADMIN'],
      editar: this.editorPuede('editar') ? ['ADMIN', 'EDITOR'] : ['ADMIN'],
      eliminar: this.editorPuede('eliminar') ? ['ADMIN', 'EDITOR'] : ['ADMIN']
    };
    this.saving.set(true);
    this.message.set('');
    this.guardado.set('');
    this.service.update(datos)
      .then(guardados => {
        this.permisos.set(guardados);
        this.guardado.set('Permisos guardados');
        this.saving.set(false);
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible guardar los permisos'));
        this.saving.set(false);
      });
  }
}
