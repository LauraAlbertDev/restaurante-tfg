import { HttpInterceptorFn } from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {AuthService} from '../../services/auth-service';
import {inject} from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authService = inject(AuthService);
  let cloned = req;
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  return next(cloned).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        alert('Tu sesión ha expirado. Por seguridad, vas a ser redirigido al login.');
        authService.logoutWithAlert();
      }
      return throwError(() => error);
    }));
}
