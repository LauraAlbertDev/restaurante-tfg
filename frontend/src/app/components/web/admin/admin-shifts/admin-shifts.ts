import {Component, inject, OnInit, signal} from '@angular/core';
import {ReservationsService} from '../../../../services/reservation-service';
import {FormsModule} from '@angular/forms';
import {generateDayNames} from '../../../../common/utils/date-utils';
import {DayRule, Shift} from '../../../../common/interfaces/interfaces';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-admin-shifts',
  imports: [
    FormsModule
  ],
  templateUrl: './admin-shifts.html',
  styleUrl: './admin-shifts.css',
})
export class AdminShifts implements OnInit {
  private reservationService = inject(ReservationsService);
  private readonly ui = inject(UiService);

  readonly dayNames = generateDayNames()

  dayRules = signal<DayRule[]>([]);
  shifts = signal<Shift[]>([]);

  ngOnInit() { this.loadData(); }

  loadData() {
    this.reservationService.getAdminSettings().subscribe({
      next: (data) => {
        this.dayRules.set(data.dayRules);
        this.shifts.set(data.shifts);
      },
      error: (err) => this.ui.handleError("Error cargando configuración", err)
    });
  }

  updateDay(day: any) {
    const { day_of_week, max_capacity, is_open } = day;
    this.reservationService.saveDayLimit(day_of_week, max_capacity, is_open).subscribe({
      next: () => this.ui.notify('Configuración actualizada correctamente'),
      error: (err) => this.ui.handleError("No se pudo actualizar el día", err)
    });
  }

  addShift(time: string) {
    if (!time) return;
    this.reservationService.addShift(time).subscribe({
      next: () => this.loadData(),
      error: (err) => this.ui.handleError("Error al añadir turno", err)
    });
  }

  async deleteShift(id: number) {
    const confirmed = await this.ui.confirm('¿Deseas eliminar este turno?');

    if (confirmed) {
      this.reservationService.removeShift(id).subscribe({
        next: () => {
          this.ui.notify('Turno eliminado');
          this.loadData();
        },
        error: (err: any) => this.ui.handleError('Error al eliminar', err)
      });
    }
  }

}
