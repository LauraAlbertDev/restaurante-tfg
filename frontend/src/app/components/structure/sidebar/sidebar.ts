import {Component, inject, input, model, output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Allergen, Category, Product} from '../../../common/interfaces/interfaces';
import {DietaryService} from '../../../services/dietary-options';

@Component({
  selector: 'app-sidebar',
  imports: [
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  categories = input<Category[]>([]);
  allergens = input<Allergen[]>([]);

  search = model('');
  selectedCategory = model<number | null>(null);
  maxPrice = model(100);
  absoluteMaxPrice = input<number>(0)

  selectedAllergens = model<number[]>([]);
  onReset = output<void>();


  private readonly dietaryService = inject(DietaryService);
  vegan = model(false);
  vegetarian = model(false);

  reset() {
    this.selectedAllergens.set([]);
    this.onReset.emit();
  }

  get dietas() {
    const [vegetarian, vegan] = this.dietaryService.getOptions();
    return [
      { name: vegetarian.name, icon: vegetarian.icon, ngModel: this.vegan },
      { name: vegan.name, icon: vegan.icon, ngModel: this.vegetarian },
    ];
  }
  toggleAllergen(id: number) {
    const current = this.selectedAllergens();
    if (current.includes(id)) {
      this.selectedAllergens.set(current.filter(aid => aid !== id));
    } else {
      this.selectedAllergens.set([...current, id]);
    }
  }


}
