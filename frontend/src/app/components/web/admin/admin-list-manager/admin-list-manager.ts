import {Component, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-admin-list-manager',
  imports: [
    FormsModule
  ],
  templateUrl: './admin-list-manager.html',
  styleUrl: './admin-list-manager.css',
})
export class AdminListManager {
  title = input.required<string>();
  showColor = input<boolean>(false);
  loading = input<boolean>(false);

  items = input.required<any[]>();
  editId = input<number | null>(null);

  newName = input<string>('');
  newColor = input<string>('');
  editText = input<string>('');
  editColor = input<string>('');

  onCreate = output<void>();
  onDelete = output<number>();
  onStartEdit = output<any>();
  onSaveEdit = output<number>();
  onCancelEdit = output<void>();

  newNameChange = output<string>();
  newColorChange = output<string>();
  editTextChange = output<string>();
  editColorChange = output<string>();
}
