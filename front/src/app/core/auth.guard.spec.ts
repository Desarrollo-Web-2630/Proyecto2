import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { authGuard } from './auth.guard';
import { sesionDePrueba } from './sesion-de-prueba';

describe('authGuard', () => {
  const ejecutar = () =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('deja pasar con sesión vigente', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('ADMIN'));
    expect(ejecutar()).toBeTrue();
  });

  it('manda al login sin sesión', () => {
    const resultado = ejecutar() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login');
  });

  it('manda al login y cierra la sesión si el token venció', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar(sesionDePrueba('ADMIN', -1000));

    const resultado = ejecutar() as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login');
    expect(sesion.usuario()).toBeNull();
    expect(sessionStorage.getItem('sesion')).toBeNull();
  });
});
