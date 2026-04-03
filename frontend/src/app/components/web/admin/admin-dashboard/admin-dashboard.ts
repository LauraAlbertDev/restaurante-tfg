import {Component, inject, OnInit, signal} from '@angular/core';
import {ReservationsService} from '../../../../services/reservation-service';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard{}
