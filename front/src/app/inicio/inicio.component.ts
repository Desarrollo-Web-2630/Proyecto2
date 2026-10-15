import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionService } from '../services/sesion.service';

@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './inicio.component.html'
})
export class InicioComponent {
  protected readonly sesion = inject(SesionService);
}
