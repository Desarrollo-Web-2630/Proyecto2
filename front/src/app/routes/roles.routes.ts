import { Routes } from '@angular/router';
import { rolGuard } from '../core/guards/rol.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    title: 'Roles de proceso',
    loadComponent: () => import('../pages/roles/rol-list/rol-list.component').then(m => m.RolListComponent)
  },
  {
    path: 'nuevo',
    canActivate: [rolGuard('ADMIN')],
    title: 'Nuevo rol',
    loadComponent: () => import('../pages/roles/rol-form/rol-form.component').then(m => m.RolFormComponent)
  },
  {
    path: ':id/editar',
    canActivate: [rolGuard('ADMIN')],
    title: 'Editar rol',
    loadComponent: () => import('../pages/roles/rol-form/rol-form.component').then(m => m.RolFormComponent)
  }
];
