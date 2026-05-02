import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Reservation, TableColumn} from '../../../../../common/interfaces/interfaces';
import {ReservationsService} from '../../../../../services/reservation-service';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {
  getTodayISO
} from '../../../../../common/utils/date-utils';
import {UiService} from '../../../../../services/ui-service';
import {AuthService} from '../../../../../services/auth-service';
import {GenericTable} from '../../../../shared/generic-table/generic-table';

@Component({
  selector: 'app-reservations-list',
  imports: [
    RouterLink,
    FormsModule,
    GenericTable
  ],
  templateUrl: './reservations-list.html',
  styleUrl: './reservations-list.css',
})
export class ReservationsList implements OnInit {
  private readonly reservationService = inject(ReservationsService);
  protected readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);

  startDate = signal<string>(getTodayISO());
  endDate = signal<string>(getTodayISO());
  allReservations = signal<Reservation[]>([]);
  statusFilter = signal<string[]>(['unconfirmed', 'confirmed']);

  protected readonly FILTER_OPTIONS = [
    { label: 'Todos', value: 'unconfirmed,confirmed,cancelled' },
    { label: 'Pendientes y Confirmadas', value: 'unconfirmed,confirmed' },
    { label: 'Pendientes', value: 'unconfirmed' },
    { label: 'Confirmadas', value: 'confirmed' },
    { label: 'Canceladas', value: 'cancelled' }
  ];

  reservationsColumns: TableColumn<Reservation>[] = [
    { label: 'Cliente', key: 'name', subKey: 'phone', type: 'avatar', sortable: true },
    { label: 'Fecha', key: 'date', type: 'date', sortable: true },
    { label: 'Hora', key: 'hour', type: 'badge', sortable: true },
    { label: 'Personas', key: 'n_people', type: 'text', sortable: true },
    { label: 'Arroces', key: 'rices', type: 'text', sortable: true },
    { label: 'Creador', key: 'creator_name', type: 'badge', sortable: true },
    { label: 'Acciones', key: 'actions', type: 'actions' }
  ];

  protected readonly COLUMNS = [
    { field: 'name',         label: 'Cliente' },
    { field: 'date',         label: 'Fecha' },
    { field: 'hour',         label: 'Hora' },
    { field: 'n_people',     label: 'Pax' },
    { field: 'rices',        label: 'Arroces' },
    { field: 'creator_name', label: 'Creador' }
  ] as const;

  filteredReservations = computed(() => {
    return this.allReservations().filter(res =>
      res.date >= this.startDate() &&
      res.date <= this.endDate() &&
      this.statusFilter().includes(res.status)
    );
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

  getRowClass = (res: Reservation): string => {
    const status = res.status;
    if (status === 'confirmed') return 'table-success-custom';
    if (status === 'unconfirmed') return 'table-grey-custom';
    if (status === 'cancelled') return 'table-danger-custom';
    return '';
  }
}
