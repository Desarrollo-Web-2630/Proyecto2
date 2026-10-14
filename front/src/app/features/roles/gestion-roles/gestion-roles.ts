import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajeDeError } from '../../../core/api-error';
import { RolProcesoDetalle, RolProcesoRequest } from '../../../core/models/rol-proceso.model';
import { RolProcesoService } from '../../../core/services/rol-proceso.service';
import { SesionService } from '../../../core/services/sesion.service';
import { mostrarError, sinSoloEspacios } from '../../../shared/validadores';

const TAMANO_PAGINA = 10;

// Texto que explica por qué un rol no se puede eliminar (HU-19)
export function explicarRolEnUso(rol: RolProcesoDetalle): string {
  const procesos = rol.procesosEnUso.map((p) => p.nombre).join(', ');
  return `No se puede eliminar el rol "${rol.nombre}": está en uso en ${procesos}. Reasigna primero esas lanes a otro rol.`;
}

@Component({
  selector: 'app-gestion-roles',
  imports: [ReactiveFormsModule],
  templateUrl: './gestion-roles.html',
  styleUrl: './gestion-roles.css',
})
export class GestionRoles implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly rolesApi = inject(RolProcesoService);
  private readonly sesion = inject(SesionService);

  protected readonly mostrarError = mostrarError;

  protected readonly roles = signal<RolProcesoDetalle[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  // Término de búsqueda ya aplicado (el campo de texto puede ir adelante)
  protected readonly filtro = signal('');

  protected readonly cargando = signal(true);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly editandoId = signal<number | null>(null);
  protected readonly aEliminar = signal<RolProcesoDetalle | null>(null);

  // HU-17, HU-18 y HU-19: solo el admin de la empresa gestiona roles. Los demás roles de acceso consultan (HU-20).
  protected readonly puedeGestionar = computed(() => this.sesion.esAdmin());

  protected readonly formBusqueda = this.fb.group({ texto: ['', Validators.maxLength(100)] });

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, sinSoloEspacios, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, sinSoloEspacios, Validators.maxLength(500)]],
  });

  async ngOnInit(): Promise<void> {
    await this.recargar();
    this.cargando.set(false);
  }

  // Trae la página actual con el filtro aplicado. Si la página quedó vacía (se eliminó el último de ella), retrocede.
  private async recargar(): Promise<void> {
    try {
      let resultado = await this.rolesApi.buscar(this.filtro(), this.pagina(), TAMANO_PAGINA);
      if (resultado.content.length === 0 && this.pagina() > 0) {
        this.pagina.set(Math.max(0, resultado.totalPages - 1));
        resultado = await this.rolesApi.buscar(this.filtro(), this.pagina(), TAMANO_PAGINA);
      }
      this.roles.set(resultado.content);
      this.total.set(resultado.totalElements);
      this.totalPaginas.set(resultado.totalPages);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  // Ejecuta una acción de escritura, deja el mensaje de éxito y refresca el listado
  private async ejecutar(accion: () => Promise<unknown>, exito: string): Promise<boolean> {
    this.ocupado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      await accion();
      this.aviso.set(exito);
      await this.recargar();
      return true;
    } catch (e) {
      this.error.set(mensajeDeError(e));
      return false;
    } finally {
      this.ocupado.set(false);
    }
  }

  // HU-20: búsqueda por nombre
  protected async buscar(): Promise<void> {
    if (this.formBusqueda.invalid) {
      return;
    }
    this.error.set(null);
    this.aviso.set(null);
    this.filtro.set(this.formBusqueda.controls.texto.value.trim());
    this.pagina.set(0);
    this.ocupado.set(true);
    await this.recargar();
    this.ocupado.set(false);
  }

  protected async limpiarBusqueda(): Promise<void> {
    this.formBusqueda.controls.texto.setValue('');
    await this.buscar();
  }

  protected async irAPagina(n: number): Promise<void> {
    if (n < 0 || n >= this.totalPaginas() || n === this.pagina()) {
      return;
    }
    this.pagina.set(n);
    this.ocupado.set(true);
    await this.recargar();
    this.ocupado.set(false);
  }

  // HU-17 (crear) y HU-18 (editar) usan el mismo formulario
  protected async guardar(): Promise<void> {
    if (!this.puedeGestionar()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    const datos: RolProcesoRequest = { nombre: d.nombre.trim(), descripcion: d.descripcion.trim() };
    const editando = this.editandoId();
    if (editando === null) {
      const ok = await this.ejecutar(() => this.rolesApi.crear(datos), `Rol "${datos.nombre}" creado.`);
      if (ok) {
        this.form.reset({ nombre: '', descripcion: '' });
      }
      return;
    }
    const ok = await this.ejecutar(
      () => this.rolesApi.actualizar(editando, datos),
      `Rol "${datos.nombre}" actualizado. Las lanes que lo usan muestran el nombre nuevo.`,
    );
    if (ok) {
      this.cancelarEdicion();
    }
  }

  protected iniciarEdicion(rol: RolProcesoDetalle): void {
    this.cancelarEliminar();
    this.error.set(null);
    this.aviso.set(null);
    this.editandoId.set(rol.id);
    this.form.setValue({ nombre: rol.nombre, descripcion: rol.descripcion });
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
  }

  // HU-19: un rol en uso no se elimina: se explica en qué procesos está. Si está libre, se pide confirmar.
  protected pedirEliminar(rol: RolProcesoDetalle): void {
    this.cancelarEdicion();
    this.aviso.set(null);
    if (!rol.eliminable) {
      this.aEliminar.set(null);
      this.error.set(explicarRolEnUso(rol));
      return;
    }
    this.error.set(null);
    this.aEliminar.set(rol);
  }

  protected cancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  protected async confirmarEliminar(): Promise<void> {
    const rol = this.aEliminar();
    if (!rol || !this.puedeGestionar()) {
      return;
    }
    const ok = await this.ejecutar(() => this.rolesApi.eliminar(rol.id), `Rol "${rol.nombre}" eliminado.`);
    if (ok) {
      this.aEliminar.set(null);
    }
  }
}
