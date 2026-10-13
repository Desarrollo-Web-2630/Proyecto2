import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import { Proceso } from '../../../core/models/proceso.model';
import { ComparticionService } from '../../../core/services/comparticion.service';

@Component({
  selector: 'app-procesos-compartidos',
  imports: [RouterLink],
  template: `
    <h1>Compartidos conmigo</h1>
    @if (error(); as msg) {
      <div class="alerta alerta-error" role="alert">{{ msg }}</div>
    }
    <section class="tarjeta">
      @if (cargando()) {
        <p>Cargando…</p>
      } @else if (procesos().length === 0) {
        <p class="ayuda">Ninguna empresa ha compartido procesos contigo.</p>
      } @else {
        <table>
          <thead><tr><th>Proceso</th><th>Categoría</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            @for (p of procesos(); track p.id) {
              <tr>
                <td>{{ p.nombre }}</td>
                <td>{{ p.categoria }}</td>
                <td><span class="chip">{{ p.estado }}</span></td>
                <td><a class="btn btn-sec btn-mini" [routerLink]="['/procesos', p.id, 'pools']">Ver diagrama</a></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
})
export class ProcesosCompartidos implements OnInit {
  private readonly comparticionApi = inject(ComparticionService);
  protected readonly procesos = signal<Proceso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.procesos.set(await this.comparticionApi.compartidosConmigo());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
