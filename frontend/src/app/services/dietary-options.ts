import { Injectable, signal } from '@angular/core';
import { DIETARY_OPTIONS, DietaryOption } from '../common/interfaces/dietary-config';

@Injectable({
  providedIn: 'root'
})
export class DietaryService {
  private readonly options = signal<DietaryOption[]>(DIETARY_OPTIONS);

  getOptions() {
    return this.options();
  }


}
