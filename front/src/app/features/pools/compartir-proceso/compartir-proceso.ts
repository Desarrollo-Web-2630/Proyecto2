import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import { Empresa } from '../../../core/models/empresa.model';
import { Proceso } from '../../../core/models/proceso.model';
import { ComparticionService } from '../../../core/services/comparticion.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ProcesoService } from '../../../core/services/proceso.service';
import { SesionService } from '../../../core/services/sesion.service';
import { estaMarcado } from '../../../shared/validadores';

@Component({
  selector: 'app-compartir-proceso',
  imports: [RouterLink],
  templateUrl: './compartir-proceso.html',
})
export class CompartirProceso implements OnInit {
  private readonly comparticionApi = inject(ComparticionService);
  private readonly empresasApi = inject(EmpresaService);
  private readonly procesosApi = inject(ProcesoService);
  private readonly sesion = inject(SesionService);

  readonly procesoId = input.required<string>();
  protected readonly estaMarcado = estaMarcado;

  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly compartido = signal(false);
  protected readonly seleccion = signal<ReadonlySet<number>>(new Set());
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly otrasEmpresas = computed(() =>
    this.empresas().filter((e) => e.id !== this.sesion.empresaId()),
  );

  async ngOnInit(): Promise<void> {
    const id = Number(this.procesoId());
    try {
      const [proceso, comparticion, empresas] = await Promise.all([
        this.procesosApi.obtener(id),
        this.comparticionApi.obtener(id),
        this.empresasApi.listar(),
      ]);
      this.proceso.set(proceso);
      this.compartido.set(comparticion.compartido);
      this.seleccion.set(new Set(comparticion.empresasIds));
      this.empresas.set(empresas);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected alternar(empresaId: number, marcado: boolean): void {
    const nueva = new Set(this.seleccion());
    if (marcado) {
      nueva.add(empresaId);
    } else {
      nueva.delete(empresaId);
    }
    this.seleccion.set(nueva);
  }

  protected async guardar(): Promise<void> {
    const empresasIds = this.compartido() ? [...this.seleccion()] : [];
    if (this.compartido() && empresasIds.length === 0) {
      this.error.set('Selecciona al menos una empresa o desactiva la opción de compartir.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      const r = await this.comparticionApi.actualizar(Number(this.procesoId()), {
        compartido: this.compartido(),
        empresasIds,
      });
      this.compartido.set(r.compartido);
      this.seleccion.set(new Set(r.empresasIds));
      this.aviso.set(r.compartido ? `Proceso compartido con ${r.empresasIds.length} empresa(s).` : 'El proceso ya no está compartido.');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
