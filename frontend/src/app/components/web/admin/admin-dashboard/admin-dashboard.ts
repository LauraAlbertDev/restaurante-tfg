import {Component, inject, OnInit, signal} from '@angular/core';
import {ReservationsService} from '../../../../services/reservation-service';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    FormsModule,
    RouterLink,
    NgClass
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard{
  public readonly modules= [
    {
      title: 'Operativa de Sala',
      icon: '🍽️',
      colorClass: 'primary',
      links: [
        { label: 'Órdenes Activas', description: 'Comandas en curso y facturación', url: '/auth/orders-list' }, // <-- NUEVO
        { label: 'Mapa de Mesas', description: 'Plano físico y estados', url: '/auth/mesas' },
        { label: 'Reservas', description: 'Lista maestra de clientes', url: '/auth/reservations-list' }
      ]
    },
    {
      title: 'Oferta Gastronómica',
      icon: '🍱',
      colorClass: 'success',
      links: [
        { label: 'Categorías', description: 'Gestión de platos y bebidas', url: '/admin/categories' },
        { label: 'Alérgenos', description: 'Seguridad alimentaria', url: '/admin/allergens' },
        { label: 'Turnos y Capacidad', description: 'Horarios de cocina y salón', url: '/admin/shifts' }
      ]
    },
    {
      title: 'Administración',
      icon: '🛡️',
      colorClass: 'info',
      links: [
        { label: 'Personal', description: 'Gestión de staff y permisos', url: '/admin/users' },
        { label: 'Feedback', description: 'Reseñas y comentarios', url: '/admin/comments-list' },
        { label: 'Calendario', description: 'Días especiales y cierres', url: '/admin/special-days' }
      ]
    }
  ];
}
