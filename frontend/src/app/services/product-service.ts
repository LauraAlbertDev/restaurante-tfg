import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Product, Allergen } from '../common/interfaces/interfaces';
import {environment} from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}products`;

  products = signal<Product[]>([]);

  getProducts(categoryId?: number, archived: number = 0): Observable<Product[]> {
    let params = new HttpParams().set('archived', archived.toString());
    if (categoryId) params = params.set('category_id', categoryId.toString());

    return this.http.get<Product[]>(this.baseUrl, { params }).pipe(
      tap(data => this.products.set(data))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/get/${id}`);
  }

  saveProduct(id: number | undefined, productData: any, file: File | null, allergenIds: number[]): Observable<any> {
    const body = this.buildProductFormData(productData, file, allergenIds);
    const request$ = id
      ? this.http.put<Product>(`${this.baseUrl}/${id}`, body)
      : this.http.post<Product>(this.baseUrl, body);

    return request$.pipe(
      tap((updatedProduct) => {
        this.products.update(prev => {
          if (id) {
            return prev.map(p => p.id === id ? updatedProduct : p);
          } else {
            return [updatedProduct, ...prev];
          }
        });
      })
    );
  }

  private buildProductFormData(data: any, file: File | null, allergenIds: number[]): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const formattedValue = typeof value === 'boolean' ? (value ? '1' : '0') : value;
        formData.append(key, formattedValue as string);
      }
    });

    if (file) formData.append('image_file', file);
    formData.append('allergen_ids', JSON.stringify(allergenIds));

    return formData;
  }

  toggleArchive(id: number): Observable<{new_archived_status: number}> {
    return this.http.put<{new_archived_status: number}>(`${this.baseUrl}/archive/${id}`, {});
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  duplicate(id: number): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  getAllergens(): Observable<Allergen[]> {
    return this.http.get<Allergen[]>(`${environment.apiUrl}allergens`);
  }

  importProducts(data:FormData){
    return this.http.post(environment.apiUrl + "products/import", data);
  }

  exportProducts() {
    return this.http.get(`${environment.apiUrl}products/export`, {responseType: 'blob'});
  }

  updateStock(id: string | number, change: number): boolean {
    let found = false;

    this.products.update(currentProducts => {
      const updated = currentProducts.map(p => {
        if (String(p.id) === String(id)) {
          found = true;
          return { ...p, stock: (p.stock || 0) + change };
        }
        return p;
      });

      // IMPORTANTE: Si usas localStorage, debes guardar aquí
      localStorage.setItem('products', JSON.stringify(updated));

      return updated;
    });

    return found;
  }

  updateStockOnServer(productId: string | number, amount: number): Observable<Product> {
    const id = Number(productId);

    if (isNaN(id)) throw new Error('ID de producto no válido');

    const body = { amount: Number(amount) };

    return this.http.patch<Product>(`${this.baseUrl}/${id}/stock`, body).pipe(
      tap({
        next: (updatedProduct) => {
          this.products.update(list =>
            list.map(p => p.id === updatedProduct.id ? updatedProduct : p)
          );
        }
      })
    );
  }
}
