import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environment/environment';
import {tap} from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router : Router = inject(Router);

   logout(){
    localStorage.clear();
    this.router.navigate(['/login']);
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
    return localStorage.getItem('type') === 'admin';
  }


}
