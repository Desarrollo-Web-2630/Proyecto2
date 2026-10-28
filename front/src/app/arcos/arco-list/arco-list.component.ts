import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, switchMap } from 'rxjs';
import { mensajeDeError } from '../../core/api-error';
import { Arco } from '../../models/arco.model';
import { Proceso } from '../../models/proceso.model';
import { ActividadService } from '../../services/actividad.service';
import { ArcoService } from '../../services/arco.service';
import { GatewayService } from '../../services/gateway.service';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

interface Elemento {
  id: number;
  nombre: string;
  tipo: string;
}

// HU-11 y HU-12
@Component({
  selector: 'app-arco-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './arco-list.component.html'
})
export class ArcoListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly arcoService = inject(ArcoService);
  private readonly actividadService = inject(ActividadService);
  private readonly gatewayService = inject(GatewayService);
  private readonly procesoService = inject(ProcesoService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly arcos = signal<Arco[]>([]);
  protected readonly elementos = signal<Elemento[]>([]);
  protected readonly message = signal('');
  protected readonly actionError = signal('');
  protected readonly aviso = signal('');
  protected readonly editando = signal<Arco | null>(null);

  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  protected readonly form = this.fb.group({
    nombre: ['', Validators.maxLength(255)],
    condicion: ['', Validators.maxLength(255)],
    origenId: [null as number | null, Validators.required],
    destinoId: [null as number | null, Validators.required]
  });

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    forkJoin({
      proceso: this.procesoService.get(this.id),
      arcos: this.arcoService.list(this.id),
      actividades: this.actividadService.list(this.id),
      gateways: this.gatewayService.list(this.id)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ proceso, arcos, actividades, gateways }) => {
          this.proceso.set(proceso);
          this.arcos.set(arcos);
          this.elementos.set([
            ...actividades.map(a => ({ id: a.id, nombre: a.nombre, tipo: 'Actividad' })),
            ...gateways.map(g => ({ id: g.id, nombre: g.nombre, tipo: 'Gateway' }))
          ]);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los arcos'));
          this.status.set('error');
        }
      });
  }

  private ejecutar(accion: Observable<unknown>, porDefecto: string, alTerminar?: () => void): void {
    this.actionError.set('');
    this.aviso.set('');
    accion
      .pipe(
        switchMap(() => this.arcoService.list(this.id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: arcos => {
          this.arcos.set(arcos);
          alTerminar?.();
        },
        error: err => this.actionError.set(mensajeDeError(err, porDefecto))
      });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const datos = {
      nombre: valores.nombre?.trim() || null,
      condicion: valores.condicion?.trim() || null,
      origenId: Number(valores.origenId),
      destinoId: Number(valores.destinoId)
    };
    const arco = this.editando();
    const accion = arco
      ? this.arcoService.update(this.id, arco.id, datos)
      : this.arcoService.create(this.id, datos);
    this.ejecutar(accion, 'No fue posible guardar el arco', () => this.cancelar());
  }

  editar(arco: Arco): void {
    this.editando.set(arco);
    this.form.setValue({
      nombre: arco.nombre ?? '',
      condicion: arco.condicion ?? '',
      origenId: arco.origenId,
      destinoId: arco.destinoId
    });
  }

  cancelar(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', condicion: '', origenId: null, destinoId: null });
  }

  eliminar(arco: Arco): void {
    if (!confirm('¿Eliminar este arco?')) {
      return;
    }
    this.actionError.set('');
    this.aviso.set('');
    this.arcoService
      .delete(this.id, arco.id)
      .pipe(
        switchMap(respuesta => {
          this.aviso.set(respuesta.advertencia ?? '');
          return this.arcoService.list(this.id);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: arcos => this.arcos.set(arcos),
        error: err => this.actionError.set(mensajeDeError(err, 'No fue posible eliminar el arco'))
      });
  }
}
