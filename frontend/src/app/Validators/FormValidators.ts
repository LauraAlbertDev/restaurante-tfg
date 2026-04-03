import {AbstractControl, FormControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export class FormValidators {

  static nonOnlyWhiteSpace(control: FormControl): ValidationErrors | null {
    if((control.value != null) && (control.value.trim().length == 0)) return {nonOnlyWhiteSpace: true};
    else return null;
  }

  static emailDominio(dominio: string) {
    return (control: FormControl): ValidationErrors | null => {
      const email = control.value;
      if (!email) return null;
      if (!email.toLowerCase().endsWith('@' + dominio.toLowerCase())) return { emailDominio: true };
      return null;
    };
  }

  static minValue(value: number): ValidationErrors | null{
    return (control: FormControl): ValidationErrors | null => {
      if (control.value < value) return {minValue: true};
      else return null;
    }
  }

  static allowedExtension(regex: RegExp): ValidationErrors | null{
    return (control: FormControl): ValidationErrors | null => {
      const allowed = regex.test(control.value);
      return allowed? null: {allowedExtension: true};
    }
  }

  static minDate(minDateStr: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const selectedDate = new Date(control.value);
      selectedDate.setHours(0, 0, 0, 0);

      const minDate = new Date(minDateStr);
      minDate.setHours(0, 0, 0, 0);

      return selectedDate < minDate ? { minDateError: true } : null;
    };
  }
}
