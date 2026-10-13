import { Component, computed, input } from '@angular/core';
import { Actividad } from '../../../core/models/proceso.model';
import { Lane, Pool, RolProceso, esCajaNegra } from '../../../core/models/pool.model';

const ANCHO = 960;
const FRANJA_POOL = 34;
const FRANJA_LANE = 130;
const ALTO_LANE = 110;
const ALTO_CAJA_NEGRA = 70;
const SEPARACION = 28;
const ACT_ANCHO = 120;
const ACT_ALTO = 54;
const ACT_PASO = 150;

interface ActividadDibujo { id: number; nombre: string; x: number; y: number; }
interface LaneDibujo { id: number; nombre: string; rol: string; y: number; alto: number; par: boolean; actividades: ActividadDibujo[]; }
interface PoolDibujo { id: number; nombre: string; cajaNegra: boolean; y: number; alto: number; lanes: LaneDibujo[]; }

@Component({
  selector: 'app-diagrama-pool',
  templateUrl: './diagrama-pool.html',
  styleUrl: './diagrama-pool.css',
})
export class DiagramaPool {
  readonly pools = input.required<Pool[]>();
  readonly lanesPorPool = input.required<Record<number, Lane[]>>();
  readonly actividades = input<Actividad[]>([]);
  readonly roles = input<RolProceso[]>([]);

  protected readonly ancho = ANCHO;
  protected readonly franjaPool = FRANJA_POOL;
  protected readonly franjaLane = FRANJA_LANE;
  protected readonly actAncho = ACT_ANCHO;
  protected readonly actAlto = ACT_ALTO;

  protected readonly dibujo = computed(() => {
    const nombreRol = new Map(this.roles().map((r) => [r.id, r.nombre]));
    const pools: PoolDibujo[] = [];
    let y = 0;

    const ordenados = [...this.pools()].sort((a, b) => Number(esCajaNegra(a.tipo)) - Number(esCajaNegra(b.tipo)));

    for (const pool of ordenados) {
      const cajaNegra = esCajaNegra(pool.tipo);
      const lanes = cajaNegra ? [] : [...(this.lanesPorPool()[pool.id] ?? [])].sort((a, b) => a.orden - b.orden);
      const alto = cajaNegra ? ALTO_CAJA_NEGRA : Math.max(lanes.length, 1) * ALTO_LANE;

      const lanesDibujo = lanes.map((lane, i): LaneDibujo => {
        const yLane = y + i * ALTO_LANE;
        const acts = this.actividades()
          .filter((a) => a.laneId === lane.id)
          .sort((a, b) => a.posicionX - b.posicionX)
          .map((a, j) => ({
            id: a.id,
            nombre: a.nombre,
            x: FRANJA_POOL + FRANJA_LANE + 20 + j * ACT_PASO,
            y: yLane + (ALTO_LANE - ACT_ALTO) / 2,
          }));
        return {
          id: lane.id,
          nombre: lane.nombre,
          rol: nombreRol.get(lane.rolProcesoId) ?? 'Rol no encontrado',
          y: yLane,
          alto: ALTO_LANE,
          par: i % 2 === 0,
          actividades: acts,
        };
      });

      pools.push({ id: pool.id, nombre: pool.nombre, cajaNegra, y, alto, lanes: lanesDibujo });
      y += alto + SEPARACION;
    }
    return { pools, alto: Math.max(y - SEPARACION, 1) };
  });

  // Actividades con una lane que no existe
  protected readonly huerfanas = computed(() => {
    const ids = new Set(Object.values(this.lanesPorPool()).flat().map((l) => l.id));
    return this.actividades().filter((a) => !ids.has(a.laneId));
  });

  protected recortar(texto: string, max = 16): string {
    return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
  }
}
