import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, switchMap } from 'rxjs';
import { mensajeDeError } from '../../core/api-error';
import { Actividad } from '../../models/actividad.model';
import { Mensaje, PoliticaFallo, TipoMensaje, VarianteMensaje } from '../../models/mensaje.model';
import { Pool } from '../../models/pool.model';
import { Proceso } from '../../models/proceso.model';
import { ActividadService } from '../../services/actividad.service';
import { MensajeService } from '../../services/mensaje.service';
import { PoolService } from '../../services/pool.service';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-25 a HU-28
@Component({
  selector: 'app-mensaje-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './mensaje-list.component.html'
})
export class MensajeListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mensajeService = inject(MensajeService);
  private readonly poolService = inject(PoolService);
  private readonly actividadService = inject(ActividadService);
  private readonly procesoService = inject(ProcesoService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly pools = signal<Pool[]>([]);
  protected readonly actividades = signal<Actividad[]>([]);
  protected readonly message = signal('');
  protected readonly actionError = signal('');
  protected readonly editando = signal<Mensaje | null>(null);

  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  protected readonly tiposMensaje: { valor: TipoMensaje; texto: string }[] = [
    { valor: 'THROW', texto: 'THROW · enviar' },
    { valor: 'CATCH', texto: 'CATCH · recibir' }
  ];
  protected readonly variantesMensaje: { valor: VarianteMensaje; texto: string }[] = [
    { valor: 'INICIO', texto: 'Inicio' },
    { valor: 'INTERMEDIO', texto: 'Intermedio' }
  ];
  protected readonly politicasFallo: { valor: PoliticaFallo; texto: string }[] = [
    { valor: 'REINTENTAR', texto: 'Reintentar' },
    { valor: 'FALLAR', texto: 'Fallar' },
    { valor: 'REGISTRAR', texto: 'Registrar' }
  ];

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    claveCorrelacion: ['', [Validators.required, Validators.maxLength(255)]],
    poolOrigenId: [null as number | null, Validators.required],
    poolDestinoId: [null as number | null, Validators.required],
    elementoOrigenId: [null as number | null],
    tipoMensaje: ['THROW' as TipoMensaje],
    variante: ['INICIO' as VarianteMensaje],
    destinoExterno: [''],
    payload: [''],
    politicaFallo: [null as PoliticaFallo | null]
  });

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    forkJoin({
      proceso: this.procesoService.get(this.id),
      mensajes: this.mensajeService.list(this.id),
      pools: this.poolService.list(this.id),
      actividades: this.actividadService.list(this.id)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ proceso, mensajes, pools, actividades }) => {
          this.proceso.set(proceso);
          this.mensajes.set(mensajes);
          this.pools.set(pools);
          this.actividades.set(actividades);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los mensajes'));
          this.status.set('error');
        }
      });
  }

  private ejecutar(accion: Observable<unknown>, porDefecto: string, alTerminar?: () => void): void {
    this.actionError.set('');
    accion
      .pipe(
        switchMap(() => this.mensajeService.list(this.id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: mensajes => {
          this.mensajes.set(mensajes);
          alTerminar?.();
        },
        error: err => this.actionError.set(mensajeDeError(err, porDefecto))
      });
  }

  nombrePool(poolId: number): string {
    return this.pools().find(p => p.id === poolId)?.nombre ?? '—';
  }

  nombreActividad(id: number | null): string {
    return this.actividades().find(a => a.id === id)?.nombre ?? '—';
  }

  guardar(): void {
    if (!this.puedeEditar()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    if (valores.poolOrigenId === valores.poolDestinoId) {
      this.actionError.set('Un mensaje viaja entre dos pools distintos');
      return;
    }
    const datos = {
      nombre: (valores.nombre ?? '').trim(),
      claveCorrelacion: (valores.claveCorrelacion ?? '').trim(),
      poolOrigenId: Number(valores.poolOrigenId),
      poolDestinoId: Number(valores.poolDestinoId),
      elementoOrigenId: valores.elementoOrigenId === null ? null : Number(valores.elementoOrigenId),
      tipoMensaje: valores.tipoMensaje ?? 'THROW',
      variante: valores.variante ?? 'INICIO',
      destinoExterno: (valores.destinoExterno ?? '').trim() || null,
      payload: (valores.payload ?? '').trim() || null,
      politicaFallo: valores.politicaFallo ?? null
    };
    const mensaje = this.editando();
    const accion = mensaje
      ? this.mensajeService.update(this.id, mensaje.id, datos)
      : this.mensajeService.create(this.id, datos);
    this.ejecutar(accion, 'No fue posible guardar el mensaje', () => this.cancelar());
  }

  editar(mensaje: Mensaje): void {
    if (!this.puedeEditar()) {
      return;
    }
    this.editando.set(mensaje);
    this.form.setValue({
      nombre: mensaje.nombre,
      claveCorrelacion: mensaje.claveCorrelacion,
      poolOrigenId: mensaje.poolOrigenId,
      poolDestinoId: mensaje.poolDestinoId,
      elementoOrigenId: mensaje.elementoOrigenId,
      tipoMensaje: mensaje.tipoMensaje ?? 'THROW',
      variante: mensaje.variante ?? 'INICIO',
      destinoExterno: mensaje.destinoExterno ?? '',
      payload: mensaje.payload ?? '',
      politicaFallo: mensaje.politicaFallo ?? null
    });
  }

  cancelar(): void {
    this.editando.set(null);
    this.form.reset({
      nombre: '',
      claveCorrelacion: '',
      poolOrigenId: null,
      poolDestinoId: null,
      elementoOrigenId: null,
      tipoMensaje: 'THROW',
      variante: 'INICIO',
      destinoExterno: '',
      payload: '',
      politicaFallo: null
    });
  }

  eliminar(mensaje: Mensaje): void {
    if (!this.puedeEliminar()) {
      return;
    }
    if (!confirm(`¿Eliminar el mensaje ${mensaje.nombre}?`)) {
      return;
    }
    this.ejecutar(this.mensajeService.delete(this.id, mensaje.id), 'No fue posible eliminar el mensaje');
  }
}
