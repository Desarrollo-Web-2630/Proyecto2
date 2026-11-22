import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../core/api-error';
import { HistorialCambio } from '../models/historial.model';
import { HistorialService } from '../services/historial.service';

@Component({
  selector: 'app-historial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './historial.component.html'
})
export class HistorialComponent implements OnInit {
  private readonly service = inject(HistorialService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly cambios = signal<HistorialCambio[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    const procesoId = this.procesoId();
    const fuente = procesoId === undefined ? this.service.list() : this.service.porProceso(Number(procesoId));
    fuente.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: cambios => {
        this.cambios.set(cambios);
        this.status.set('success');
      },
      error: err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar el historial'));
        this.status.set('error');
      }
    });
  }
}
