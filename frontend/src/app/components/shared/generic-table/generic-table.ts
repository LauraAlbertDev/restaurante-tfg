import {Component, computed, effect, input, signal, TemplateRef, untracked} from '@angular/core';
import {DatePipe, NgTemplateOutlet} from "@angular/common";
import {TableColumn} from '../../../common/interfaces/interfaces';

@Component({
  selector: 'app-generic-table',
  imports: [
    DatePipe,
    NgTemplateOutlet
  ],
  templateUrl: './generic-table.html',
  styleUrl: './generic-table.css',
})
export class GenericTable<T> {
  protected readonly String = String;
  data = input.required<T[]>();
  columns = input.required<TableColumn<T>[]>();
  actionTemplate = input<TemplateRef<any>>();
  rowClassFunc = input<(item: T) => string>();

  currentPage = signal(1);
  pageSize = signal(10);
  sortKey = signal<keyof T | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');

  constructor() {
    effect(() => {
      this.data();
      untracked(() => this.currentPage.set(1));
    });
  }

  paginatedData = computed(() => {
    let transformedData = [...this.data()];

    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      transformedData.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return transformedData.slice(startIndex, startIndex + this.pageSize());
  });

  toggleSort(key: keyof T | 'actions') {
    if (key === 'actions') return;

    if (this.sortKey() === key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  totalPages = computed(() => Math.ceil(this.data().length / this.pageSize()));

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }

  getValue(item: T, key: keyof T | 'actions'): any {
    return key !== 'actions' ? item[key] : null;
  }
}
