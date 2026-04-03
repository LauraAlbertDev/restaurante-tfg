import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environment/environment';
import {Allergen} from '../common/interfaces/interfaces';
import {Observable, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AllergenService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}allergens`;

  private readonly allergensSignal = signal<Allergen[]>([]);

  readonly allergens = computed(() => {
    return [...this.allergensSignal()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  });

  readonly count = computed(() => this.allergensSignal().length);

  load(): Observable<Allergen[]> {
    return this.http.get<Allergen[]>(this.API_URL).pipe(
      tap(data => this.allergensSignal.set(data))
    );
  }

  create(name: string, color:string): Observable<Allergen> {
    return this.http.post<Allergen>(this.API_URL, { name, color });
  }

  update(id: number, name: string, color:string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}`, { name, color });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  addLocal(Allergen: Allergen): void {
    this.allergensSignal.update(current => [...current, Allergen]);
  }

  removeLocal(id: number): void {
    this.allergensSignal.update(current => current.filter(allergen => allergen.id !== id));
  }

  updateLocal(id: number, name: string, color: string) {
    this.allergensSignal.update(list =>
      list.map(a => a.id === id ? { ...a, name, color } : a)
    );
  }
}
