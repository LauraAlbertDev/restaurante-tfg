import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {environment} from '../environment/environment';
import {Category} from '../common/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}categories`;

  private readonly categoriesSignal = signal<Category[]>([]);

  readonly categories = this.categoriesSignal.asReadonly();

  readonly count = computed(() => this.categoriesSignal().length);

  load(): void {
    this.http.get<Category[]>(this.API_URL).subscribe({
      next: (data) => this.categoriesSignal.set(data),
      error: (err) => console.error('Error al recuperar categorías:', err)
    });
  }

  create(name: string): Observable<Category> {
    return this.http.post<Category>(this.API_URL, {name});
  }

  update(id: number, name: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}`, {name});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  addLocal(category: Category): void {
    this.categoriesSignal.update(current => [...current, category]);
  }

  removeLocal(id: number): void {
    this.categoriesSignal.update(current => current.filter(cat => cat.id !== id));
  }

  updateLocal(id: number, name: string): void {
    this.categoriesSignal.update(current =>
      current.map(cat => cat.id === id ? {...cat, name} : cat)
    );
  }
}
