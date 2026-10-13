import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { mostrarError } from '../../../shared/validadores';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mostrarError = mostrarError;

  protected readonly form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected async entrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigate(['/procesos']);
    } catch (e) {
      // Mensaje genérico, no revela si el correo existe
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
