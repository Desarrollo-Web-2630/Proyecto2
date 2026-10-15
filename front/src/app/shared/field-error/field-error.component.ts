import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

// Muestra el error de un campo cuando ya fue tocado
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as m) {
      <small class="error" role="alert">{{ m }}</small>
    }
  `
})
export class FieldErrorComponent {
  control = input.required<AbstractControl>();
  messages = input<Record<string, string>>({});

  protected message(): string | null {
    const control = this.control();
    if (control.touched && control.errors) {
      const key = Object.keys(control.errors)[0];
      return this.messages()[key] ?? 'Valor inválido';
    }
    return null;
  }
}
