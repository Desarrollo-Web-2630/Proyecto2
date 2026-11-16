import { Routes } from '@angular/router';
import { rolGuard } from '../core/rol.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    title: 'Roles de proceso',
    loadComponent: () => import('./rol-list/rol-list.component').then(m => m.RolListComponent)
  },
  {
    path: 'nuevo',
    canActivate: [rolGuard('ADMIN')],
    title: 'Nuevo rol',
    loadComponent: () => import('./rol-form/rol-form.component').then(m => m.RolFormComponent)
  },
  {
    path: ':id/editar',
    canActivate: [rolGuard('ADMIN')],
    title: 'Editar rol',
    loadComponent: () => import('./rol-form/rol-form.component').then(m => m.RolFormComponent)
  }
];
