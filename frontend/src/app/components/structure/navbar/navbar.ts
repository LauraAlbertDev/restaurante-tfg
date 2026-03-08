import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {AuthService} from '../../../services/auth-service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar  {
  activeMenu: 'admin' | 'user' | null = null;

  pages = [
    { name: 'Inicio', link: '/' },
    { name: 'Nosotros', link: '/nosotros' },
    { name: 'Menú', link: '/menu' },
    { name: 'Contacto', link: '/contacto'}
  ];

  adminPages = [
    { name: 'Usuarios', link: '/admin/users', icon: 'people' },
    { name: 'Comentarios', link: 'admin/comments-list', icon: 'chat-dots-fill' },
    { name: 'Categorias', link: 'admin/categories', icon: 'bookmarks' }
  ];

  auth = inject(AuthService);
  router = inject(Router);

  logOut(){
    this.auth.logout();
    this.closeMenus();
    this.router.navigate(['/login']);
  }

  closeMenus() {
    this.activeMenu = null;
  }

  toggleMenu(menu: 'admin' | 'user') {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

}
