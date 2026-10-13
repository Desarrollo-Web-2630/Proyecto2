import { Component, OnInit, inject, signal } from '@angular/core';
import { mensajeDeError } from '../../../core/api-error';
import {
  ACCIONES_POOL,
  AccionPool,
  PERMISOS_POOL_POR_DEFECTO,
  PermisosPool,
  RolProceso,
} from '../../../core/models/pool.model';
import { ETIQUETA_ROL_ACCESO, ROLES_ACCESO, RolAcceso } from '../../../core/models/usuario.model';
import { PermisosPoolService } from '../../../core/services/permisos-pool.service';
import { RolProcesoService } from '../../../core/services/rol-proceso.service';
import { estaMarcado } from '../../../shared/validadores';

const ETIQUETA_ACCION: Record<AccionPool, string> = {
  crear: 'Crear pools y lanes',
  editar: 'Editar / reordenar',
  eliminar: 'Eliminar',
};

@Component({
  selector: 'app-permisos-pool',
  templateUrl: './permisos-pool.html',
})
export class PermisosPoolPagina implements OnInit {
  private readonly permisosApi = inject(PermisosPoolService);
  private readonly rolesApi = inject(RolProcesoService);

  protected readonly acciones = ACCIONES_POOL;
  protected readonly rolesAcceso = ROLES_ACCESO;
  protected readonly etiquetaRol = ETIQUETA_ROL_ACCESO;
  protected readonly etiquetaAccion = ETIQUETA_ACCION;
  protected readonly estaMarcado = estaMarcado;

  protected readonly permisos = signal<PermisosPool>(PERMISOS_POOL_POR_DEFECTO);
  protected readonly rolesProceso = signal<RolProceso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const [permisos, roles] = await Promise.all([this.permisosApi.cargar(), this.rolesApi.listar()]);
      this.permisos.set(permisos);
      this.rolesProceso.set(roles);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected fijo(rol: RolAcceso): boolean {
    return rol === 'ADMIN' || rol === 'LECTURA';
  }

  protected tiene(accion: AccionPool, rol: RolAcceso): boolean {
    return this.permisos()[accion].includes(rol);
  }

  protected alternar(accion: AccionPool, rol: RolAcceso, marcado: boolean): void {
    if (this.fijo(rol)) {
      return;
    }
    const actual = this.permisos();
    const lista = actual[accion].filter((r) => r !== rol);
    this.permisos.set({ ...actual, [accion]: marcado ? [...lista, rol] : lista });
  }

  protected async guardar(): Promise<void> {
    const p = this.permisos();
    const normalizar = (roles: RolAcceso[]): RolAcceso[] =>
      ['ADMIN' as const, ...roles.filter((r) => r === 'EDITOR')];
    const datos: PermisosPool = {
      crear: normalizar(p.crear),
      editar: normalizar(p.editar),
      eliminar: normalizar(p.eliminar),
    };
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      this.permisos.set(await this.permisosApi.guardar(datos));
      this.aviso.set('Permisos guardados.');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
