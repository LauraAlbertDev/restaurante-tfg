import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Allergen } from '../../../../common/interfaces/interfaces';
import { AllergenService } from '../../../../services/allergen-service';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-admin-allergens',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './admin-allergens.html',
  styleUrl: './admin-allergens.css',
})
export class AdminAllergens implements OnInit {
  private allergenSrv = inject(AllergenService);
  private readonly ui = inject(UiService);
  allergens = this.allergenSrv.allergens;

  newName = signal('');
  newColor = signal('#0d6efd'); // Color azul por defecto

  editId = signal<number | null>(null);
  editText = signal('');
  editColor = signal('#0d6efd'); // Signal que te faltaba

  loading = signal(false);

  ngOnInit() {
    this.allergenSrv.load().subscribe({
      next: (data) => console.log('Alérgenos cargados:', data),
      error: (err) => this.ui.handleError('Error al cargar alérgenos:', err)
    });
  }

  create() {
    const nombre = this.newName().trim();
    const color = this.newColor();
    if (!nombre || this.loading()) return;

    this.loading.set(true);

    this.allergenSrv.create(nombre, color).subscribe({
      next: (newAllergen) => {
        this.allergenSrv.addLocal(newAllergen);
        this.newName.set('');
        this.newColor.set('#0d6efd');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.detail || "Error al crear");
      }
    });
  }

  startEdit(allergen: Allergen) {
    this.editId.set(allergen.id);
    this.editText.set(allergen.name);
    this.editColor.set(allergen.color || '#0d6efd');
  }

  saveEdit(id: number) {
    const nombre = this.editText().trim();
    const color = this.editColor();
    if (!nombre || this.loading()) return;

    this.loading.set(true);
    this.allergenSrv.update(id, nombre, color).subscribe({
      next: () => {
        this.allergenSrv.updateLocal(id, nombre, color);
        this.cancelEdit();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.detail || "Error al actualizar");
      }
    });
  }

  delete(id: number) {
    if (!confirm("¿Eliminar alérgeno?")) return;

    this.loading.set(true);
    this.allergenSrv.delete(id).subscribe({
      next: () => {
        this.allergenSrv.removeLocal(id);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.detail || "No se pudo eliminar");
      }
    });
  }

  cancelEdit() {
    this.editId.set(null);
    this.editText.set('');
    this.editColor.set('#0d6efd');
  }
}
