import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environment/environment';
import {tap} from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userType = signal<string | null>(localStorage.getItem('type'));
  private http : HttpClient = inject(HttpClient);
  private router : Router = inject(Router);

  // LOG-IN/LOG-OUT
  login(email: string, password: string){
    return this.http.post<any>(environment.apiUrl + 'auth/login', {
      email,
      password
    }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('name', res.name);
        localStorage.setItem('type', res.type);
        this.userType.set(res.type);
        this.redirectByRole(res.type);
      })
    )
  }

  logout(){
    localStorage.clear();
    this.userType.set(null);
    this.router.navigate(['/login']);
  }

  // GETTERS
  getToken(){
    return localStorage.getItem('token') || '';
  }

  getType(){
    return localStorage.getItem('type') || '';
  }

  // USER LOGGED?
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch (e) {
      return false;
    }
  }

  // ROLES
  isAdmin(){
    return this.isAuthenticated() && this.userType() === 'admin';
  }

  isEmployee(){
    return localStorage.getItem('type') === 'employee';
  }

  redirectByRole(role: string) {
    if(role === 'admin'){
      this.router.navigate(['/']);
      return;
    }

    if(role === 'employee'){
      this.router.navigate(['/']);
      return;
    }

    // fallback
    this.router.navigate(['/']);
  }

  // En tu AuthService.ts
  private isRedirecting = false;

  logoutWithAlert() {
    if (this.isRedirecting) return;

    this.isRedirecting = true;
    alert('Tu sesión ha expirado, vas a ser redirigido al login');
    this.logout();

    setTimeout(() => this.isRedirecting = false, 3000);
  }
}
