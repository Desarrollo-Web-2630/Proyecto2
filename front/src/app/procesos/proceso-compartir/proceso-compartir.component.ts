import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Empresa } from '../../models/empresa.model';
import { Proceso } from '../../models/proceso.model';
import { ComparticionService } from '../../services/comparticion.service';
import { EmpresaService } from '../../services/empresa.service';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-23: solo el administrador de la empresa dueña cambia la compartición
@Component({
  selector: 'app-proceso-compartir',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './proceso-compartir.component.html'
})
export class ProcesoCompartirComponent implements OnInit {
  private readonly comparticionService = inject(ComparticionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly procesoService = inject(ProcesoService);
  protected readonly sesion = inject(SesionService);

  readonly procesoId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly compartido = signal(false);
  protected readonly seleccion = signal<number[]>([]);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly guardado = signal('');

  ngOnInit(): void {
    const id = Number(this.procesoId());
    Promise.all([this.procesoService.get(id), this.comparticionService.get(id), this.empresaService.list()])
      .then(([proceso, comparticion, empresas]) => {
        this.proceso.set(proceso);
        this.compartido.set(comparticion.compartido);
        this.seleccion.set(comparticion.empresasIds);
        // No se comparte con la misma empresa
        this.empresas.set(empresas.filter(e => e.id !== this.sesion.usuario()?.empresaId));
        this.status.set('success');
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible cargar el proceso'));
        this.status.set('error');
      });
  }

  alternarEmpresa(empresaId: number): void {
    this.seleccion.update(ids => ids.includes(empresaId) ? ids.filter(id => id !== empresaId) : [...ids, empresaId]);
  }

  guardar(): void {
    const empresasIds = this.compartido() ? this.seleccion() : [];
    if (this.compartido() && empresasIds.length === 0) {
      this.message.set('Selecciona al menos una empresa o desactiva la opción de compartir');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.guardado.set('');
    this.comparticionService.update(Number(this.procesoId()), { compartido: this.compartido(), empresasIds })
      .then(() => {
        this.guardado.set('Cambios guardados');
        this.saving.set(false);
      })
      .catch(err => {
        this.message.set(mensajeDeError(err, 'No fue posible guardar la compartición'));
        this.saving.set(false);
      });
  }
}
