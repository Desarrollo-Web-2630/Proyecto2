import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import { Proceso } from '../../../core/models/proceso.model';
import { ProcesoService } from '../../../core/services/proceso.service';
import { SesionService } from '../../../core/services/sesion.service';

@Component({
  selector: 'app-lista-procesos',
  imports: [RouterLink],
  templateUrl: './lista-procesos.html',
})
export class ListaProcesos implements OnInit {
  private readonly procesosApi = inject(ProcesoService);
  protected readonly sesion = inject(SesionService);

  protected readonly procesos = signal<Proceso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.procesos.set(await this.procesosApi.listar());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
