import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}users`;

  // 📋 GESTIÓN DE ADMINISTRACIÓN (CRUD)

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, data);
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/toggle/${id}`, {});
  }

  // 👤 GESTIÓN DEL PERFIL (USUARIO ACTUAL)

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me`, data);
  }
}
