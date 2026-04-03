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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  activeMenu: 'admin' | 'user' | null = null;

  pages = [
    { name: 'Inicio', link: '/' },
    { name: 'Menú', link: '/menu' },
    { name: 'Nosotros', link: '/nosotros' },
    { name: 'Contacto', link: '/contacto' }
  ];


  adminPages = [
    { name: 'Alergenos', link: 'allergens', icon: 'virus2' },
    { name: 'Categorias', link: 'categories', icon: 'bookmarks' },
    { name: 'Comentarios', link: 'comments-list', icon: 'chat-dots-fill' },
    { name: 'Horarios', link: 'shifts', icon: 'calendar-day' },
    { name: 'Usuarios', link: 'users', icon: 'people' }
  ];

  sharedPages = [
    { name: 'Mi perfil', link: '/auth/my-profile', icon: 'person-vcard', actionType: 'close' },
    { name: 'Cerrar Sesión', link: null, icon: 'box-arrow-left', actionType: 'logout', isDanger: true  },
  ]

  onSharedClick(page: any) {
    if (page.actionType === 'logout') {
      this.logOut();
    } else {
      this.closeMenus();
    }
  }

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.auth.getType() === 'admin';
  }

  logOut() {
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
