import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Proceso } from '../../models/proceso.model';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

@Component({
  selector: 'app-proceso-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './proceso-list.component.html'
})
export class ProcesoListComponent implements OnInit {
  private readonly service = inject(ProcesoService);
  protected readonly sesion = inject(SesionService);

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly procesos = signal<Proceso[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.service.list()
      .then(data => {
        this.procesos.set(data);
        this.status.set('success');
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar los procesos'));
        this.status.set('error');
      });
  }
}
