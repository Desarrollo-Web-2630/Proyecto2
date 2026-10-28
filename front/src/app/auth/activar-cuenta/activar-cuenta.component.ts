import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { AuthService } from '../../services/auth.service';

// Activar cuenta con el token del correo
@Component({
  selector: 'app-activar-cuenta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './activar-cuenta.component.html'
})
export class ActivarCuentaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // ?token= del enlace del correo
  readonly token = input<string>();

  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly activada = signal('');
  protected readonly reenvio = signal('');

  // Mismas reglas que ActivarCuentaRequestDTO
  protected readonly form = this.fb.nonNullable.group({
    token: ['', Validators.required],
    nuevaPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    confirmacion: ['', Validators.required]
  });

  protected readonly formReenvio = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    const token = this.token();
    if (token) {
      this.form.controls.token.setValue(token);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    if (datos.nuevaPassword !== datos.confirmacion) {
      this.message.set('Las contraseñas no coinciden');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.authService.activarCuenta({ token: datos.token.trim(), nuevaPassword: datos.nuevaPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: respuesta => this.activada.set(respuesta.mensaje),
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible activar la cuenta'));
          this.saving.set(false);
        }
      });
  }

  reenviar(): void {
    if (this.formReenvio.invalid) {
      this.formReenvio.markAllAsTouched();
      return;
    }
    this.authService.reenviarVerificacion(this.formReenvio.getRawValue().correo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: respuesta => this.reenvio.set(respuesta.mensaje),
        error: err => this.reenvio.set(mensajeDeError(err, 'No fue posible reenviar el enlace'))
      });
  }
}
