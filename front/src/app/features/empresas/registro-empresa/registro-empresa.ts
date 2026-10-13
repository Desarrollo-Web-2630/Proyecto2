import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api-error';
import { Empresa } from '../../../core/models/empresa.model';
import { EmpresaService } from '../../../core/services/empresa.service';
import { PATRON_NIT, PATRON_NOMBRE_EMPRESA, mostrarError } from '../../../shared/validadores';

@Component({
  selector: 'app-registro-empresa',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro-empresa.html',
})
export class RegistroEmpresa {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly empresas = inject(EmpresaService);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly registrada = signal<Empresa | null>(null);
  protected readonly mostrarError = mostrarError;

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255), Validators.pattern(PATRON_NOMBRE_EMPRESA)]],
    nit: ['', [Validators.required, Validators.pattern(PATRON_NIT)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
  });

  protected async registrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      const datos = this.form.getRawValue();
      const empresa = await this.empresas.registrar({
        nombre: datos.nombre.trim(),
        nit: datos.nit.trim(),
        correo: datos.correo.trim().toLowerCase(),
      });
      this.registrada.set(empresa);
      this.form.reset();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
