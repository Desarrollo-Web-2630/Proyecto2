import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, switchMap } from 'rxjs';
import { mensajeDeError } from '../../core/api-error';
import { Gateway, TipoGateway } from '../../models/gateway.model';
import { Proceso } from '../../models/proceso.model';
import { GatewayService } from '../../services/gateway.service';
import { ProcesoService } from '../../services/proceso.service';
import { SesionService } from '../../services/sesion.service';

// HU-14
@Component({
  selector: 'app-gateway-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './gateway-list.component.html'
})
export class GatewayListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gatewayService = inject(GatewayService);
  private readonly procesoService = inject(ProcesoService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly procesoId = input.required<string>();

  protected readonly tipos: { valor: TipoGateway; texto: string }[] = [
    { valor: 'EXCLUSIVO', texto: 'Exclusivo (un solo camino)' },
    { valor: 'PARALELO', texto: 'Paralelo (todos los caminos)' },
    { valor: 'INCLUSIVO', texto: 'Inclusivo (uno o varios caminos)' }
  ];

  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly proceso = signal<Proceso | null>(null);
  protected readonly gateways = signal<Gateway[]>([]);
  protected readonly message = signal('');
  protected readonly actionError = signal('');
  protected readonly editando = signal<Gateway | null>(null);

  protected readonly puedeEditar = computed(() => this.sesion.usuario()?.rolAcceso !== 'LECTURA');
  protected readonly puedeEliminar = computed(() => this.sesion.esAdmin());

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    tipo: ['EXCLUSIVO' as TipoGateway, Validators.required]
  });

  private get id(): number {
    return Number(this.procesoId());
  }

  ngOnInit(): void {
    forkJoin({ proceso: this.procesoService.get(this.id), gateways: this.gatewayService.list(this.id) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ proceso, gateways }) => {
          this.proceso.set(proceso);
          this.gateways.set(gateways);
          this.status.set('success');
        },
        error: err => {
          this.message.set(mensajeDeError(err, 'No fue posible cargar los gateways'));
          this.status.set('error');
        }
      });
  }

  private ejecutar(accion: Observable<unknown>, porDefecto: string, alTerminar?: () => void): void {
    this.actionError.set('');
    accion
      .pipe(
        switchMap(() => this.gatewayService.list(this.id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: gateways => {
          this.gateways.set(gateways);
          alTerminar?.();
        },
        error: err => this.actionError.set(mensajeDeError(err, porDefecto))
      });
  }

  textoTipo(tipo: TipoGateway): string {
    return this.tipos.find(t => t.valor === tipo)?.texto ?? tipo;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, tipo } = this.form.getRawValue();
    const datos = { nombre: nombre.trim(), tipo };
    const gateway = this.editando();
    const accion = gateway
      ? this.gatewayService.update(this.id, gateway.id, datos)
      : this.gatewayService.create(this.id, datos);
    this.ejecutar(accion, 'No fue posible guardar el gateway', () => this.cancelar());
  }

  editar(gateway: Gateway): void {
    this.editando.set(gateway);
    this.form.setValue({ nombre: gateway.nombre, tipo: gateway.tipo });
  }

  cancelar(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', tipo: 'EXCLUSIVO' });
  }

  eliminar(gateway: Gateway): void {
    if (!confirm(`¿Eliminar el gateway ${gateway.nombre}? También se eliminarán sus arcos.`)) {
      return;
    }
    this.ejecutar(this.gatewayService.delete(this.id, gateway.id), 'No fue posible eliminar el gateway');
  }
}
