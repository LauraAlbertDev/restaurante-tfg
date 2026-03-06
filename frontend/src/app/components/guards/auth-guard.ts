import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const userType = authService.getType();
  const requiredRole = route.data?.['role'];

  if (!requiredRole) return true;

  const rolePermissions: Record<string, string[]> = {
    'admin': ['admin'],
    'employee': ['admin', 'employee']
  };

  const hasPermission = rolePermissions[requiredRole]?.includes(userType);

  if (!hasPermission) {
    alert('No tienes permisos suficientes para acceder aquí');
    router.navigate(['/']);
    return false;
  }

  return true;
};
