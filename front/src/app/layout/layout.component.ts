import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SesionService } from '../services/sesion.service';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);

  constructor() {
    // El acceso lo controla authGuard; esto cubre la sesión que vence o se cierra estando ya dentro
    effect(() => {
      if (!this.sesion.usuario()) {
        const expirada = this.sesion.motivoCierre() === 'expirada';
        this.router.navigate(['/login'], {
          queryParams: expirada ? { motivo: 'expirada', redirect: this.router.url } : {}
        });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
