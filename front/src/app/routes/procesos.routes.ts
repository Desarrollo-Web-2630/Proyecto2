import { Routes } from '@angular/router';
import { rolGuard } from '../core/guards/rol.guard';

export const PROCESOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Procesos',
    loadComponent: () => import('../pages/procesos/proceso-list/proceso-list.component').then(m => m.ProcesoListComponent)
  },
  {
    path: 'nuevo',
    canActivate: [rolGuard('ADMIN', 'EDITOR')],
    title: 'Nuevo proceso',
    loadComponent: () => import('../pages/procesos/proceso-form/proceso-form.component').then(m => m.ProcesoFormComponent)
  },
  {
    path: ':id/editar',
    canActivate: [rolGuard('ADMIN', 'EDITOR')],
    title: 'Editar proceso',
    loadComponent: () => import('../pages/procesos/proceso-form/proceso-form.component').then(m => m.ProcesoFormComponent)
  },
  {
    path: ':procesoId/editor',
    title: 'Editor del proceso',
    loadComponent: () => import('../pages/editor/editor-proceso/editor-proceso.component').then(m => m.EditorProcesoComponent)
  },
  {
    path: ':procesoId/pools',
    title: 'Pools y lanes',
    loadComponent: () => import('../pages/pools/pool-list/pool-list.component').then(m => m.PoolListComponent)
  },
  {
    path: ':procesoId/gateways',
    title: 'Gateways',
    loadComponent: () => import('../pages/gateways/gateway-list/gateway-list.component').then(m => m.GatewayListComponent)
  },
  {
    path: ':procesoId/arcos',
    title: 'Arcos',
    loadComponent: () => import('../pages/arcos/arco-list/arco-list.component').then(m => m.ArcoListComponent)
  },
  {
    path: ':procesoId/mensajes',
    title: 'Mensajes',
    loadComponent: () => import('../pages/mensajes/mensaje-list/mensaje-list.component').then(m => m.MensajeListComponent)
  },
  {
    path: ':procesoId/actividades',
    title: 'Actividades',
    loadComponent: () => import('../pages/actividades/actividad-list/actividad-list.component').then(m => m.ActividadListComponent)
  },
  {
    path: ':procesoId/actividades/nueva',
    canActivate: [rolGuard('ADMIN', 'EDITOR')],
    title: 'Nueva actividad',
    loadComponent: () => import('../pages/actividades/actividad-form/actividad-form.component').then(m => m.ActividadFormComponent)
  },
  {
    path: ':procesoId/actividades/:id/editar',
    canActivate: [rolGuard('ADMIN', 'EDITOR')],
    title: 'Editar actividad',
    loadComponent: () => import('../pages/actividades/actividad-form/actividad-form.component').then(m => m.ActividadFormComponent)
  }
];
