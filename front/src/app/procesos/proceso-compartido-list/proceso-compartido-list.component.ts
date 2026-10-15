import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Proceso } from '../../models/proceso.model';
import { ComparticionService } from '../../services/comparticion.service';

// HU-23: procesos compartidos con mi empresa
@Component({
  selector: 'app-proceso-compartido-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './proceso-compartido-list.component.html'
})
export class ProcesoCompartidoListComponent implements OnInit {
  private readonly service = inject(ComparticionService);

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly procesos = signal<Proceso[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    this.service.listCompartidos()
      .then(data => {
        this.procesos.set(data);
        this.status.set('success');
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar los procesos compartidos'));
        this.status.set('error');
      });
  }
}
