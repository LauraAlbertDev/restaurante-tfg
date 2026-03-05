import {FormControl, ValidationErrors} from '@angular/forms';

export class FormValidators {

  static nonOnlyWhiteSpace(control: FormControl): ValidationErrors | null {
    if((control.value != null) && (control.value.trim().length == 0)) {
      return {nonOnlyWhiteSpace: true};
    }else {
      return null;
    }
  }

    static minToday(control: FormControl): ValidationErrors | null {
    if (!control.value) return null;

    const inputDate = new Date(control.value);
    const today = new Date();

    // quitar horas para comparar solo fecha
    today.setHours(0,0,0,0);
    inputDate.setHours(0,0,0,0);

    if (inputDate < today) return { minToday: true };


    return null;
  }



}
