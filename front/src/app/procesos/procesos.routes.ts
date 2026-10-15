import { Routes } from '@angular/router';

export const PROCESOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Procesos',
    loadComponent: () => import('./proceso-list/proceso-list.component').then(m => m.ProcesoListComponent)
  },
  {
    path: 'compartidos',
    title: 'Compartidos conmigo',
    loadComponent: () => import('./proceso-compartido-list/proceso-compartido-list.component').then(m => m.ProcesoCompartidoListComponent)
  },
  {
    path: ':procesoId/compartir',
    title: 'Compartir proceso',
    loadComponent: () => import('./proceso-compartir/proceso-compartir.component').then(m => m.ProcesoCompartirComponent)
  },
  {
    path: ':procesoId/pools',
    title: 'Pools y lanes',
    loadComponent: () => import('../pools/pool-list/pool-list.component').then(m => m.PoolListComponent)
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
