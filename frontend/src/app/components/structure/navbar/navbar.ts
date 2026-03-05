import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../services/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  pages = [
    {
      name: 'Inicio',
      link: '/'
    },
    {
      name: 'Menu',
      link: 'menu'
    },
    {
      name: 'Nosotros',
      link: 'nosotros'
    },
    {
      name: 'Contacto',
      link: 'contacto'
    },
    {
      name: 'Reservas',
      link: 'reservas'
    }
  ];
  adminPages = [
    {
      name: 'Usuarios',
      link: '/admin/users',
      icon: 'people-fill',
    },
    {
      name: 'Categorias',
      link: '/admin/categorias',
      icon: 'bookmark',
    },
    {
      name: 'Añadir Producto',
      link: '/product/add',
      icon: 'plus-lg',
    },
    {
      name: 'Dashboard',
      link: '/admin/dashboard',
      icon: 'bar-chart-fill',
    },
    {
      name: 'Comentarios',
      link: '/comments/list',
      icon: 'chat-left-text-fill',
    }
  ]

  auth = inject(AuthService);
  router = inject(Router);

  logOut(){
    this.auth.logout();
    this.router.navigate(['/login']);
  }

}
