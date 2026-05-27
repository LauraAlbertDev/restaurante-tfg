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

  saveProduct(id: number | undefined, rawProduct: any, file: File | null, allergenIds: number[]) {
    const formData = new FormData();
    const fields = ['name', 'description'];
    fields.forEach(key => formData.append(key, rawProduct[key] || ''));
    formData.append('price', rawProduct.price?.toString() || '0');
    formData.append('category_id', rawProduct.category_id?.toString() || '');
    formData.append('stock', rawProduct.stock?.toString() || '0');
    formData.append('vegan', rawProduct.vegan ? '1' : '0');
    formData.append('vegetarian', rawProduct.vegetarian ? '1' : '0');
    formData.append('allergen_ids', JSON.stringify(allergenIds));

    if (file) formData.append('image_file', file, file.name);
    const apiBase = environment.apiUrl.replace(/\/$/, '');
    const url = `${apiBase}/products/${id ?? ''}`;
    return id ? this.http.put(url, formData) : this.http.post(url, formData);
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
    return this.http.post(`${this.baseUrl}/import`, data);  }

  exportProducts() {
    console.log("URL de exportación:", `${this.baseUrl}/export`);
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
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
