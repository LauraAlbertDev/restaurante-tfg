import {Component, inject, input, output, signal} from '@angular/core';
import {UiService} from '../../../../services/ui-service';
import {Observable} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {ManagedItem} from '../../../../common/interfaces/interfaces';

@Component({
  selector: 'app-base-admin-manager',
  imports: [
    FormsModule
  ],
  templateUrl: './base-admin-manager.html',
  styleUrl: './base-admin-manager.css',
})
export abstract class BaseAdminManager<T extends ManagedItem> {
  protected readonly ui = inject(UiService);

  items = signal<T[]>([]);
  loading = signal(false);

  newName = signal('');
  newColor = signal('#0d6efd');

  editId = signal<number | null>(null);
  editText = signal('');
  editColor = signal('#0d6efd');

  abstract loadItems(): Observable<T[]>;

  abstract createItem(name: string, color?: string): Observable<T>;

  abstract updateItem(id: number, name: string, color?: string): Observable<any>;

  abstract deleteItem(id: number): Observable<any>;

  init() {
    this.loading.set(true);
    this.loadItems().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.ui.handleError('Error al cargar los datos', err);
        this.loading.set(false);
      }
    });
  }


  create() {
    const name = this.newName().trim();
    if (!name || this.loading()) return;

    this.loading.set(true);
    this.createItem(name, this.newColor()).subscribe({
      next: (newItem) => {
        this.items.update(list => [...list, newItem]);
        this.newName.set('');
        this.newColor.set('#0d6efd');
        this.loading.set(false);
        this.ui.notify('Creado correctamente');
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400 && err.error?.detail) {
          this.ui.handleError(err.error.detail, err);
        } else {
          this.ui.handleError('Error al crear', err);
        }
      }
    });
  }

  startEdit(item: T) {
    this.editId.set(item.id);
    this.editText.set(item.name);
    this.editColor.set(item.color || '#0d6efd');
  }

  saveEdit(id: number) {
    const name = this.editText().trim();
    if (!name || this.loading()) return;

    this.loading.set(true);
    this.updateItem(id, name, this.editColor()).subscribe({
      next: () => {
        this.items.update(list =>
          list.map(item => item.id === id
            ? {...item, name, color: this.editColor()}
            : item
          )
        );
        this.cancelEdit();
        this.loading.set(false);
        this.ui.notify('Actualizado correctamente');
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400 && err.error?.detail) {
          this.ui.handleError(err.error.detail, err);
        } else {
          this.ui.handleError('Error al actualizar', err);
        }
      }
    });
  }

  async delete(id: number) {
    const confirmed = await this.ui.confirm("¿Estás seguro de que deseas eliminar este elemento?");
    if (!confirmed) return;

    this.loading.set(true);
    this.deleteItem(id).subscribe({
      next: () => {
        this.items.update(list => list.filter(item => item.id !== id));
        this.loading.set(false);
        this.ui.notify('Eliminado correctamente');
      },
      error: (err) => {
        this.loading.set(false);
        this.ui.handleError('No se pudo eliminar', err);
      }
    });
  }

  cancelEdit() {
    this.editId.set(null);
    this.editText.set('');
    this.editColor.set('#0d6efd');
  }
}
