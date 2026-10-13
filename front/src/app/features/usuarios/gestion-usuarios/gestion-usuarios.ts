import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensajeDeError } from '../../../core/api-error';
import { ETIQUETA_ROL_ACCESO, ROLES_ACCESO, RolAcceso, UsuarioVista } from '../../../core/models/usuario.model';
import { SesionService } from '../../../core/services/sesion.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PATRON_PASSWORD, mostrarError } from '../../../shared/validadores';

const PATRON_NOMBRE_PERSONA = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])[A-Za-zÁÉÍÓÚáéíóúÑñ .'-]+$/;

@Component({
  selector: 'app-gestion-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './gestion-usuarios.html',
})
export class GestionUsuarios implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usuariosApi = inject(UsuarioService);
  protected readonly sesion = inject(SesionService);

  protected readonly roles = ROLES_ACCESO;
  protected readonly etiquetaRol = ETIQUETA_ROL_ACCESO;
  protected readonly mostrarError = mostrarError;

  protected readonly usuarios = signal<UsuarioVista[]>([]);
  protected readonly cargando = signal(true);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255), Validators.pattern(PATRON_NOMBRE_PERSONA)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.maxLength(128), Validators.pattern(PATRON_PASSWORD)]],
    rolAcceso: this.fb.control<RolAcceso>('EDITOR', Validators.required),
  });

  async ngOnInit(): Promise<void> {
    await this.recargar();
    this.cargando.set(false);
  }

  private async recargar(): Promise<void> {
    try {
      this.usuarios.set(await this.usuariosApi.listar());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

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

  protected esYo(u: UsuarioVista): boolean {
    return u.id === this.sesion.usuario()?.id;
  }

  protected async invitar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    const correo = d.correo.trim().toLowerCase();
    const ok = await this.ejecutar(
      () => this.usuariosApi.invitar({ nombre: d.nombre.trim(), correo, password: d.password, rolAcceso: d.rolAcceso }),
      `Invitación enviada a ${correo}. La cuenta se activa con el enlace del correo.`,
    );
    if (ok) {
      this.form.reset({ nombre: '', correo: '', password: '', rolAcceso: 'EDITOR' });
    }
  }

  protected async cambiarRol(u: UsuarioVista, evento: Event): Promise<void> {
    const select = evento.target;
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }
    const nuevo = ROLES_ACCESO.find((r) => r === select.value);
    if (!nuevo || nuevo === u.rolAcceso) {
      return;
    }
    const ok = await this.ejecutar(
      () => this.usuariosApi.cambiarRol(u.id, nuevo),
      `${u.nombre} ahora es ${ETIQUETA_ROL_ACCESO[nuevo]}.`,
    );
    if (!ok) {
      select.value = u.rolAcceso;
    }
  }

  protected async desactivar(u: UsuarioVista): Promise<void> {
    await this.ejecutar(() => this.usuariosApi.desactivar(u.id), `${u.nombre} fue desactivado. Sus procesos siguen disponibles.`);
  }
}
