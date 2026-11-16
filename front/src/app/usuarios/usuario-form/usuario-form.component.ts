import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { RolAcceso, UsuarioRequest } from '../../models/usuario.model';
import { SesionService } from '../../services/sesion.service';
import { UsuarioService } from '../../services/usuario.service';

// HU-02: invitar usuario
@Component({
  selector: 'app-usuario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.component.html'
})
export class UsuarioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly sesion = inject(SesionService);

  protected readonly roles: RolAcceso[] = ['ADMIN', 'EDITOR', 'LECTURA'];
  protected readonly saving = signal(false);
  protected readonly message = signal('');

  // Mismas reglas que UsuarioDTO en el backend
  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    rolAcceso: ['EDITOR' as RolAcceso, Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    const usuario: UsuarioRequest = { ...datos, nombre: datos.nombre.trim(), correo: datos.correo.trim().toLowerCase() };
    this.saving.set(true);
    this.message.set('');
    this.service.create(usuario)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/usuarios']),
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible invitar al usuario'));
          this.saving.set(false);
        }
      });
  }
}
