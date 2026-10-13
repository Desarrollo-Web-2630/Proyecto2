import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Mismas reglas que los DTO del backend
export const PATRON_NOMBRE_EMPRESA = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,&'-]+$/;
export const PATRON_NIT = /^\d{9,12}(?:-\d)?$/;
export const PATRON_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function coincidenValidator(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a: unknown = grupo.get(campo)?.value;
    const b: unknown = grupo.get(confirmacion)?.value;
    return a === b ? null : { noCoinciden: true };
  };
}

export function mostrarError(control: AbstractControl | null): boolean {
  return !!control && control.invalid && (control.touched || control.dirty);
}

export function estaMarcado(evento: Event): boolean {
  return evento.target instanceof HTMLInputElement && evento.target.checked;
}
