import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { invitadoGuard } from './invitado.guard';
import { sesionDePrueba } from './sesion-de-prueba';

describe('invitadoGuard', () => {
  const ejecutar = () =>
    TestBed.runInInjectionContext(() => invitadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('deja ver login y registro sin sesión', () => {
    expect(ejecutar()).toBeTrue();
  });

  it('con sesión manda a /procesos', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('LECTURA'));
    const resultado = ejecutar() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/procesos');
  });

  it('con sesión vencida deja entrar al login', () => {
    TestBed.inject(SesionService).iniciar(sesionDePrueba('ADMIN', -1000));
    expect(ejecutar()).toBeTrue();
  });
});
