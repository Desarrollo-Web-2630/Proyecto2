import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    title: 'Roles de proceso',
    loadComponent: () => import('./rol-list/rol-list.component').then(m => m.RolListComponent)
  },
  {
    path: 'nuevo',
    title: 'Nuevo rol',
    loadComponent: () => import('./rol-form/rol-form.component').then(m => m.RolFormComponent)
  },
  {
    path: ':id/editar',
    title: 'Editar rol',
    loadComponent: () => import('./rol-form/rol-form.component').then(m => m.RolFormComponent)
  }
];
