import { HttpInterceptorFn } from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {AuthService} from '../../services/auth-service';
import {inject} from '@angular/core';
import {UiService} from '../../services/ui-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authService = inject(AuthService);
  const ui = inject(UiService);


  let cloned = req;
  if (token) {
    cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(cloned).pipe(
    catchError((error) => {
      const isLoginRequest = req.url.includes('/login') || req.url.includes('/auth');

      if ((error.status === 401 || error.status === 403) && !isLoginRequest) {
        ui.handleError('Tu sesión ha expirado. Por seguridad, vas a ser redirigido.');
        authService.logoutWithAlert();
      }
      return throwError(() => error);
    })
  );
}
