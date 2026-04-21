import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Reservation, ReservationStatus, STATUS_LABELS} from '../../../../../common/interfaces/interfaces';
import {ReservationsService} from '../../../../../services/reservation-service';
import {DatePipe, NgClass} from '@angular/common';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {
  formatISOToDisplay,
  getEndOfMonthISO,
  getTodayISO
} from '../../../../../common/utils/date-utils';
import {UiService} from '../../../../../services/ui-service';
import {AuthService} from '../../../../../services/auth-service';

@Component({
  selector: 'app-reservations-list',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    NgClass
  ],
  templateUrl: './reservations-list.html',
  styleUrl: './reservations-list.css',
})
export class ReservationsList implements OnInit {
  private readonly reservationService = inject(ReservationsService);
  protected readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);

  startDate = signal<string>(getTodayISO());
  endDate = signal<string>(getEndOfMonthISO());
  allReservations = signal<Reservation[]>([]);
  statusFilter = signal<string[]>(['unconfirmed', 'confirmed']);
  sortField = signal<string>('date');
  sortDirection = signal<'asc' | 'desc'>('asc');

  protected readonly FILTER_OPTIONS = [
    { label: 'Todos', value: 'unconfirmed,confirmed,cancelled' },
    { label: 'Pendientes y Confirmadas', value: 'unconfirmed,confirmed' },
    { label: 'Pendientes', value: 'unconfirmed' },
    { label: 'Confirmadas', value: 'confirmed' },
    { label: 'Canceladas', value: 'cancelled' }
  ];

  protected readonly COLUMNS = [
    { field: 'name',         label: 'Cliente' },
    { field: 'date',         label: 'Fecha' },
    { field: 'hour',         label: 'Hora' },
    { field: 'n_people',     label: 'Pax' },
    { field: 'rices',        label: 'Paellas' },
    { field: 'creator_name', label: 'Creador' }
  ] as const;

  formatDate = formatISOToDisplay;


  filteredReservations = computed(() => {
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.allReservations()]
      .filter(res => res.date >= this.startDate() && res.date <= this.endDate() && this.statusFilter().includes(res.status))
      .sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];

        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return a.date.localeCompare(b.date) || a.hour.localeCompare(b.hour);
      });
  });

  ngOnInit() {
    this.loadReservations();
    this.statusFilter.set(['unconfirmed', 'confirmed']);
  }

  loadReservations() {
    this.reservationService.getReservations().subscribe({
      next: (data) => {
        this.allReservations.set(data);
        console.log('Datos recibidos de la API:', data);
      },
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


  onStatusFilterChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.statusFilter.set(selectElement.value.split(','));
  }

  protected readonly dateFilters = [
    { label: 'Desde', signal: this.startDate },
    { label: 'Hasta', signal: this.endDate }
  ];

  protected getSortIcon(field: string): string {
    if (this.sortField() !== field) return 'bi-filter';
    return this.sortDirection() === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  protected getRowClass(status: string): string {
    const map: Record<string, string> = {
      unconfirmed: 'table-warning',
      confirmed: 'table-success',
      cancelled: 'table-danger'
    };
    return map[status] || '';
  }
}
