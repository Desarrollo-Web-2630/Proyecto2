import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionService } from '../../../services/sesion.service';

// Destino del rolGuard cuando el rol del usuario no alcanza para la pantalla pedida
@Component({
  selector: 'app-acceso-denegado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './acceso-denegado.component.html'
})
export class AccesoDenegadoComponent {
  protected readonly sesion = inject(SesionService);
}
