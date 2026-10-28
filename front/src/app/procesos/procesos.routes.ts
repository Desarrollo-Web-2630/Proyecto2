import { Routes } from '@angular/router';

export const PROCESOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Procesos',
    loadComponent: () => import('./proceso-list/proceso-list.component').then(m => m.ProcesoListComponent)
  },
  {
    path: 'nuevo',
    title: 'Nuevo proceso',
    loadComponent: () => import('./proceso-form/proceso-form.component').then(m => m.ProcesoFormComponent)
  },
  {
    path: ':id/editar',
    title: 'Editar proceso',
    loadComponent: () => import('./proceso-form/proceso-form.component').then(m => m.ProcesoFormComponent)
  },
  {
    path: ':procesoId/pools',
    title: 'Pools y lanes',
    loadComponent: () => import('../pools/pool-list/pool-list.component').then(m => m.PoolListComponent)
  },
  {
    path: ':procesoId/gateways',
    title: 'Gateways',
    loadComponent: () => import('../gateways/gateway-list/gateway-list.component').then(m => m.GatewayListComponent)
  },
  {
    path: ':procesoId/arcos',
    title: 'Arcos',
    loadComponent: () => import('../arcos/arco-list/arco-list.component').then(m => m.ArcoListComponent)
  },
  {
    path: ':procesoId/mensajes',
    title: 'Mensajes',
    loadComponent: () => import('../mensajes/mensaje-list/mensaje-list.component').then(m => m.MensajeListComponent)
  },
  {
    path: ':procesoId/actividades',
    title: 'Actividades',
    loadComponent: () => import('../actividades/actividad-list/actividad-list.component').then(m => m.ActividadListComponent)
  },
  {
    path: ':procesoId/actividades/nueva',
    title: 'Nueva actividad',
    loadComponent: () => import('../actividades/actividad-form/actividad-form.component').then(m => m.ActividadFormComponent)
  },
  {
    path: ':procesoId/actividades/:id/editar',
    title: 'Editar actividad',
    loadComponent: () => import('../actividades/actividad-form/actividad-form.component').then(m => m.ActividadFormComponent)
  }
];
