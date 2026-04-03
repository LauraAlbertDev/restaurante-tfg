import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Reservation} from '../../../../../common/interfaces/interfaces';
import {ReservationsService} from '../../../../../services/reservation-service';
import {DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {
  formatDateToISO,
  formatISOToDisplay,
  getEndOfMonthISO,
  getTodayISO
} from '../../../../../common/utils/date-utils';
import {UiService} from '../../../../../services/ui-service';

@Component({
  selector: 'app-reservations-list',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './reservations-list.html',
  styleUrl: './reservations-list.css',
})
export class ReservationsList implements OnInit {
  private readonly reservationService = inject(ReservationsService);
  private readonly ui = inject(UiService);

  startDate = signal<string>(getTodayISO());
  endDate = signal<string>(getEndOfMonthISO());
  allReservations = signal<Reservation[]>([]);

  formatDate = formatISOToDisplay;

  filteredReservations = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    return this.allReservations()
      .filter(res => {
        const resDate = res.date.toString();
        return resDate >= start && resDate <= end;
      })
      .sort((a, b) =>
        a.date.toString().localeCompare(b.date.toString()) ||
        a.hour.localeCompare(b.hour)
      );
  });

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.reservationService.getReservations().subscribe({
      next: (data) => this.allReservations.set(data),
      error: (err) => console.error('Error al cargar reservas:', err)
    });
  }

  async deleteReservation(id: number | undefined) {
    if (!id) return;

    const confirmed = await this.ui.confirm("¿Estás seguro de que deseas eliminar esta reserva?");
    if (!confirmed) return;

    this.reservationService.deleteReservation(id).subscribe({
      next: () => {
        this.allReservations.update(list => list.filter(res => res.id !== id));
        this.ui.notify("Reserva eliminada correctamente");
      },
      error: (err) => this.ui.handleError("No se pudo eliminar la reserva", err)
    });
  }
}
