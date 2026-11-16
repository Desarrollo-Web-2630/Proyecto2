import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { AuthService } from '../../services/auth.service';

// HU-03
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);
  // Llega con ?expirada=true cuando el interceptor recibe un 401
  protected readonly message = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.has('expirada') ? 'Tu sesión venció. Inicia sesión de nuevo.' : ''
  );

  protected readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.authService.login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/procesos']),
        error: err => {
          // Mensaje genérico: no se revela si el correo existe
          this.message.set(mensajeDeError(err, 'Correo o contraseña incorrectos'));
          this.saving.set(false);
        }
      });
  }
}
