import { Routes } from '@angular/router';
import { rolGuard } from '../core/rol.guard';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Usuarios',
    loadComponent: () => import('./usuario-list/usuario-list.component').then(m => m.UsuarioListComponent)
  },
  {
    path: 'nuevo',
    canActivate: [rolGuard('ADMIN')],
    title: 'Invitar usuario',
    loadComponent: () => import('./usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent)
  }
];
