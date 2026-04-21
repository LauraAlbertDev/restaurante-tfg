import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {DatePipe, LowerCasePipe, NgClass} from "@angular/common";
import {ReservationsService} from '../../../../../services/reservation-service';
import {
  Reservation,
  STATUS_CONFIG,
} from '../../../../../common/interfaces/interfaces';

@Component({
  selector: 'app-reservations-detail',
  imports: [
    DatePipe,
    NgClass
  ],
  templateUrl: './reservations-detail.html',
  styleUrl: './reservations-detail.css',
})
export class ReservationsDetail implements OnInit {
  @Input('id') idReservation?: number;

  private readonly reservationService = inject(ReservationsService);
  protected readonly config = STATUS_CONFIG;
  reservation = signal<Reservation | null>(null);
  loaded = signal<boolean>(false);

  ngOnInit() {
    if (this.idReservation) {
      this.reservationService.getReservationById(this.idReservation).subscribe({
        next: (r) => {
          this.reservation.set(r);
          this.loaded.set(true);
        },
        error: (err) => {
          console.error('Error en la petición:', err);
          this.loaded.set(true);
        }
      });
    }
  }

}
