import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Allergen } from '../../../../common/interfaces/interfaces';
import { AllergenService } from '../../../../services/allergen-service';
import {UiService} from '../../../../services/ui-service';
import {BaseAdminManager} from '../base-admin-manager/base-admin-manager';
import {AdminListManager} from '../admin-list-manager/admin-list-manager';

@Component({
  selector: 'app-admin-allergens',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, AdminListManager],
  templateUrl: './admin-allergens.html',
  styleUrl: './admin-allergens.css',
})
export class AdminAllergens extends BaseAdminManager<Allergen> implements OnInit {
  private readonly allergenSrv = inject(AllergenService);

  ngOnInit() {
    this.init();
  }

  loadItems() { return this.allergenSrv.load(); }
  createItem(name: string, color?: string) { return this.allergenSrv.create(name, color!); }
  updateItem(id: number, name: string, color?: string) { return this.allergenSrv.update(id, name, color!); }
  deleteItem(id: number) { return this.allergenSrv.delete(id); }
}
