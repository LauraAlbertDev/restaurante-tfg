import { Injectable } from '@angular/core';
import {AbstractControl} from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FormErrorsService {
  private messages: { [key: string]: (args?: any) => string } = {
    required: () => 'Este campo es obligatorio.',
    minlength: (args) => `Mínimo ${args.requiredLength} caracteres.`,
    maxlength: (args) => `Máximo ${args.requiredLength} caracteres.`,
    email: () => 'El formato del email no es válido.',
    pattern: () => 'Formato incorrecto.',
    min: (args) => `El valor mínimo es ${args.min}.`
  };

  getErrorMessage(control: AbstractControl | null): string | null {
    if (control?.errors && (control.touched || control.dirty)) {
      const errorKey = Object.keys(control.errors)[0];
      return this.messages[errorKey] ? this.messages[errorKey](control.errors[errorKey]) : 'Error inválido';
    }
    return null;
  }
}
