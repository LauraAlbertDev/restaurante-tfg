import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {FormErrorsService} from '../../services/form-error-service';

@Pipe({ name: 'errorMessage', standalone: true })
export class ErrorMessagePipe implements PipeTransform {
  constructor(private errorService: FormErrorsService) {}

// error.pipe.ts
  transform(control: AbstractControl | null | undefined): string | null {
    // Quitamos la restricción de 'touched' para que el error
    // aparezca también al intentar enviar el formulario
    if (!control || !control.errors) return null;

    const e = control.errors;
    // ... resto de tu lógica ...
    return this.errorService.getErrorMessage(control);
  }
}
