import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    title: 'Roles de proceso',
    loadComponent: () => import('../pages/roles/rol-list/rol-list.component').then(m => m.RolListComponent)
  },
  {
    path: 'nuevo',
    title: 'Nuevo rol',
    loadComponent: () => import('../pages/roles/rol-form/rol-form.component').then(m => m.RolFormComponent)
  },
  {
    path: ':id/editar',
    title: 'Editar rol',
    loadComponent: () => import('../pages/roles/rol-form/rol-form.component').then(m => m.RolFormComponent)
  }
];
