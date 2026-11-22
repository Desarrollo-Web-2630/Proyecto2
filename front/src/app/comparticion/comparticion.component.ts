import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { mensajeDeError } from '../core/api-error';
import { EmpresaResumen } from '../models/comparticion.model';
import { ComparticionService } from '../services/comparticion.service';
import { SesionService } from '../services/sesion.service';

@Component({
  selector: 'app-comparticion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './comparticion.component.html'
})
export class ComparticionComponent implements OnInit {
  private readonly service = inject(ComparticionService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly empresas = signal<EmpresaResumen[]>([]);
  protected readonly seleccionadas = signal<number[]>([]);
  protected readonly compartido = signal(false);
  protected readonly message = signal('');
  protected readonly aviso = signal('');
  protected readonly error = signal('');
  protected readonly guardando = signal(false);
  protected readonly puedeEditar = computed(() => this.sesion.esAdmin());

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    forkJoin({ catalogo: this.service.catalogo(), comparticion: this.service.get(this.id) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ catalogo, comparticion }) => {
          this.empresas.set(catalogo);
          this.seleccionadas.set(comparticion.empresasInvitadas.map(e => e.id));
          this.compartido.set(comparticion.compartido);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar la compartición'));
          this.status.set('error');
        }
      });
  }

  alternar(idEmpresa: number, marcado: boolean): void {
    if (!this.puedeEditar()) {
      return;
    }
    this.seleccionadas.update(ids =>
      marcado ? [...new Set([...ids, idEmpresa])] : ids.filter(id => id !== idEmpresa)
    );
  }

  guardar(): void {
    if (!this.puedeEditar()) {
      return;
    }
    this.aviso.set('');
    this.error.set('');
    this.guardando.set(true);
    this.service
      .guardar(this.id, this.seleccionadas())
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: comparticion => {
          this.compartido.set(comparticion.compartido);
          this.seleccionadas.set(comparticion.empresasInvitadas.map(e => e.id));
          this.aviso.set('Compartición actualizada');
        },
        error: err => this.error.set(mensajeDeError(err, 'No fue posible guardar la compartición'))
      });
  }
}
