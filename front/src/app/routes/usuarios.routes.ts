import { Routes } from '@angular/router';
import { rolGuard } from '../core/guards/rol.guard';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Usuarios',
    loadComponent: () => import('../pages/usuarios/usuario-list/usuario-list.component').then(m => m.UsuarioListComponent)
  },
  {
    path: 'nuevo',
    canActivate: [rolGuard('ADMIN')],
    title: 'Invitar usuario',
    loadComponent: () => import('../pages/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent)
  }
];
