import {Component, inject} from '@angular/core';
import {UiService} from '../../services/ui-service';

@Component({
  selector: 'app-generic-toast',
  imports: [],
  templateUrl: './generic-toast.html',
  styleUrl: './generic-toast.css',
})
export class GenericToast {
  protected readonly ui = inject(UiService);
}
