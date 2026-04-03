import {Component, inject, OnInit, signal} from '@angular/core';
import {ReservationsService} from '../../../../services/reservation-service';
import {UiService} from '../../../../services/ui-service';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {getTodayISO} from '../../../../common/utils/date-utils';

@Component({
  selector: 'app-admin-special-days',
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './admin-special-days.html',
  styleUrl: './admin-special-days.css',
})
export class AdminSpecialDays implements OnInit {
  private readonly reservationService = inject(ReservationsService);
  private readonly ui = inject(UiService);

  closedDates = signal<string[]>([]);
  newDate = signal<string>('');
  newReason = signal<string>('');

  ngOnInit() {
    this.loadClosedDates();
  }

  loadClosedDates(): void {
    this.reservationService.getClosedDates().subscribe({
      next: (dates) => this.closedDates.set(dates),
      error: (err) => this.ui.handleError('No se pudieron cargar las fechas bloqueadas', err)
    });
  }

  get minDate(): string {
    return getTodayISO();
  }

  async blockSelectedDate() {
    const dateValue = this.newDate();

    if (!dateValue) {
      this.ui.notify('Debes seleccionar una fecha');
      return;
    }

    const payload = {
      special_date: dateValue,
      is_open: false,
      description: this.newReason()
    };

    this.reservationService.saveSpecialDay(payload).subscribe({
      next: () => {
        this.ui.notify('Día bloqueado correctamente');
        this.resetInputs();
        this.loadClosedDates();
      },
      error: (err) => this.ui.handleError('Error al bloquear', err)
    });
  }

  async unblockDate(date: string) {
    const confirmed = await this.ui.confirm(`¿Quieres volver a abrir el día ${date}?`);
    if (!confirmed) return;

    this.reservationService.deleteSpecialDay(date).subscribe({
      next: () => {
        this.ui.notify('Día habilitado de nuevo');
        this.loadClosedDates();
      },
      error: (err) => this.ui.handleError('Error al habilitar el día', err)
    });
  }

  private resetInputs() {
    this.newDate.set('');
    this.newReason.set('');
  }
}
