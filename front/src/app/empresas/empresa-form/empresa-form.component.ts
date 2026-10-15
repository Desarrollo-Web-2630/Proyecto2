import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api-error';
import { Empresa, EmpresaRequest } from '../../models/empresa.model';
import { EmpresaService } from '../../services/empresa.service';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';

// HU-01: registra la empresa y su administrador inicial
@Component({
  selector: 'app-empresa-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  templateUrl: './empresa-form.component.html'
})
export class EmpresaFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EmpresaService);

  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly registrada = signal<Empresa | null>(null);

  // Mismas reglas que EmpresaDTO en el backend
  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    nit: ['', [Validators.required, Validators.pattern(/^\d{9,12}(-\d)?$/)]],
    correo: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    const empresa: EmpresaRequest = {
      nombre: datos.nombre.trim(),
      nit: datos.nit.trim(),
      correo: datos.correo.trim().toLowerCase()
    };
    this.saving.set(true);
    this.message.set('');
    this.service.create(empresa)
      .then(creada => this.registrada.set(creada))
      .catch(err => {
        // Por ejemplo: el NIT ya está registrado
        this.message.set(mensajeDeError(err, 'No fue posible registrar la empresa'));
        this.saving.set(false);
      });
  }
}
