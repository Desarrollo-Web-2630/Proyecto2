import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { PATRON_PASSWORD, coincidenValidator, mostrarError } from '../../../shared/validadores';

@Component({
  selector: 'app-activar-cuenta',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './activar-cuenta.html',
})
export class ActivarCuenta implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);

  // ?token= del enlace del correo
  readonly token = input<string>('');

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  protected readonly mostrarError = mostrarError;

  protected readonly form = this.fb.group(
    {
      token: ['', [Validators.required]],
      nuevaPassword: ['', [Validators.required, Validators.maxLength(128), Validators.pattern(PATRON_PASSWORD)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: coincidenValidator('nuevaPassword', 'confirmacion') },
  );

  protected readonly correoReenvio = this.fb.control('', [Validators.required, Validators.email]);
  protected readonly reenvio = signal<string | null>(null);

  ngOnInit(): void {
    if (this.token()) {
      this.form.controls.token.setValue(this.token());
    }
  }

  protected async activar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      const { token, nuevaPassword } = this.form.getRawValue();
      const r = await this.auth.activarCuenta({ token: token.trim(), nuevaPassword });
      this.exito.set(r.mensaje || 'Cuenta activada.');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected async reenviar(): Promise<void> {
    if (this.correoReenvio.invalid) {
      this.correoReenvio.markAsTouched();
      return;
    }
    this.error.set(null);
    try {
      const r = await this.auth.reenviarVerificacion(this.correoReenvio.value.trim().toLowerCase());
      this.reenvio.set(r.mensaje || 'Si el correo está registrado, enviamos un nuevo enlace.');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }
}
