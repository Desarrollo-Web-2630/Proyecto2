import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/utils/api-error';
import { rutaInternaSegura } from '../../../core/utils/redireccion';
import { AuthService } from '../../../services/auth.service';

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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);
  protected readonly message = signal('');
  // Aviso cuando se llega aquí porque el token venció
  protected readonly expirada = this.route.snapshot.queryParamMap.get('motivo') === 'expirada';

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
        next: () => this.router.navigateByUrl(rutaInternaSegura(this.route.snapshot.queryParamMap.get('redirect'))),
        error: err => {
          // Mensaje genérico en 401: no se revela si el correo existe o si la clave está mal
          const credenciales = err instanceof HttpErrorResponse && err.status === 401;
          this.message.set(credenciales ? 'Correo o contraseña incorrectos' : mensajeDeError(err, 'Correo o contraseña incorrectos'));
          this.saving.set(false);
        }
      });
  }
}
