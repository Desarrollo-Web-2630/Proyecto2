import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ETIQUETA_ROL_ACCESO } from '../core/models/usuario.model';
import { AuthService } from '../core/services/auth.service';
import { SesionService } from '../core/services/sesion.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);
  protected readonly etiquetaRol = ETIQUETA_ROL_ACCESO;

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
