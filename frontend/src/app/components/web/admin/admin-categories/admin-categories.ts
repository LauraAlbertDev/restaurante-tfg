import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../services/category-service';
import { Category } from '../../../../common/interfaces/interfaces';
import {BaseAdminManager} from '../base-admin-manager/base-admin-manager';
import {AdminListManager} from '../admin-list-manager/admin-list-manager';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminListManager],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories extends BaseAdminManager<Category> implements OnInit {
  private readonly categorySrv = inject(CategoryService);

  ngOnInit() {
    this.init();
  }

  loadItems() { return this.categorySrv.load(); }
  createItem(name: string) { return this.categorySrv.create(name); }
  updateItem(id: number, name: string) { return this.categorySrv.update(id, name); }
  deleteItem(id: number) { return this.categorySrv.delete(id); }

}
