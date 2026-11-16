import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { RolAcceso } from '../models/usuario.model';
import { SesionService } from '../services/sesion.service';
import { rolGuard } from './rol.guard';
import { sesionDePrueba } from './sesion-de-prueba';

describe('rolGuard', () => {
  const ejecutar = (...roles: RolAcceso[]) =>
    TestBed.runInInjectionContext(() => rolGuard(...roles)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('ADMIN entra a una pantalla solo de ADMIN', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('ADMIN'));
    expect(ejecutar('ADMIN')).toBeTrue();
  });

  it('EDITOR entra a pantallas de ADMIN y EDITOR', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('EDITOR'));
    expect(ejecutar('ADMIN', 'EDITOR')).toBeTrue();
  });

  it('EDITOR no entra a una pantalla solo de ADMIN', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('EDITOR'));
    const resultado = ejecutar('ADMIN') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/procesos');
  });

  it('LECTURA no entra a pantallas de edición', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('LECTURA'));
    const resultado = ejecutar('ADMIN', 'EDITOR') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/procesos');
  });

  it('sin sesión no entra', () => {
    expect(ejecutar('ADMIN', 'EDITOR', 'LECTURA')).not.toBeTrue();
  });
});
