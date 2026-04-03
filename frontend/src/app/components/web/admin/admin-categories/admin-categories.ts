import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../services/category-service';
import { Category } from '../../../../common/interfaces/interfaces';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories implements OnInit {
  private categorySrv = inject(CategoryService);

  categories = this.categorySrv.categories;

  newName = signal(''); // Cambiado 'new' por 'newName' para evitar palabras reservadas
  editId = signal<number | null>(null);
  editText = signal('');
  loading = signal(false);

  ngOnInit() {
    this.categorySrv.load();
  }

  create() {
    const name = this.newName().trim();
    if (!name || this.loading()) return;

    this.loading.set(true);
    this.categorySrv.create(name).subscribe({
      next: (cat) => {
        this.categorySrv.addLocal(cat);
        this.newName.set('');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.detail || "Error al crear");
      }
    });
  }

  delete(id: number) {
    if (!confirm("¿Eliminar categoría?")) return;

    this.loading.set(true);
    this.categorySrv.delete(id).subscribe({
      next: () => {
        this.categorySrv.removeLocal(id);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.detail || "No se pudo eliminar");
      }
    });
  }

  saveEdit(id: number) {
    const name = this.editText().trim();
    if (!name || this.loading()) return;

    this.loading.set(true);
    this.categorySrv.update(id, name).subscribe({
      next: () => {
        this.categorySrv.updateLocal(id, name);
        this.cancelEdit(); // Limpia el estado de edición
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.detail || "Error al actualizar");
      }
    });
  }

  startEdit(cat: Category) {
    this.editId.set(cat.id);
    this.editText.set(cat.name);
  }

  cancelEdit() {
    this.editId.set(null);
    this.editText.set('');
  }
}
