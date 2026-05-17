import {Component, computed, effect, inject, OnInit, signal, untracked} from '@angular/core';
import {Reservation, TableColumn} from '../../../../../common/interfaces/interfaces';
import {ReservationsService} from '../../../../../services/reservation-service';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {getTodayISO} from '../../../../../common/utils/date-utils';
import {UiService} from '../../../../../services/ui-service';
import {AuthService} from '../../../../../services/auth-service';
import {GenericTable} from '../../../../shared/generic-table/generic-table';
import {TablesService} from '../../../../../services/tables_service';
import {forkJoin, switchMap} from 'rxjs';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-reservations-list',
  imports: [
    RouterLink,
    FormsModule,
    GenericTable,
    NgClass
  ],
  templateUrl: './reservations-list.html',
  styleUrl: './reservations-list.css',
})
export class ReservationsList implements OnInit {
  private readonly reservationService = inject(ReservationsService);
  protected readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);
  private readonly tablesService = inject(TablesService);
  private tableNamesMap: Record<string, string> = {};

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
    { label: 'Personas', key: 'n_people', type: 'text', sortable: true },
    { label: 'Arroces', key: 'rices', type: 'text', sortable: true },
    { label: 'Mesa', key: 'table_name', type: 'text', sortable: true },
    { label: 'Hora', key: 'hour', type: 'badge', sortable: true },
    { label: 'Creador', key: 'creator_name', type: 'badge', sortable: true },
    { label: 'Acciones', key: 'actions', type: 'actions'}
  ];

  constructor() {
    effect(() => {
      const start = this.startDate();
      const end = this.endDate();
      this.statusFilter();

      if (start && end && start > end) {
        this.ui.notify("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'");
        untracked(() => this.endDate.set(start));
        return;
      }

      untracked(() => {
        this.loadData();
      });
    });
  }

  protected readonly COLUMNS = [
    { field: 'name',         label: 'Cliente' },
    { field: 'date',         label: 'Fecha' },
    { field: 'hour',         label: 'Hora' },
    { field: 'n_people',     label: 'Pax' },
    { field: 'rices',        label: 'Arroces' },
    { field: 'table_name',   label: 'Mesa' },
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
    this.statusFilter.set(['unconfirmed', 'confirmed']);
  }

  loadData() {
    const dateFrom = this.startDate();

    this.reservationService.getReservations().subscribe({
      next: (reservations) => {
        const uniqueDatesWithReservation = Array.from(
          new Set(
            reservations
              .filter(r => r.date >= this.startDate() && r.date <= this.endDate())
              .map(r => r.date)
          )
        );

        if (!uniqueDatesWithReservation.includes(dateFrom)) uniqueDatesWithReservation.push(dateFrom);

        const requestsPlans$ = uniqueDatesWithReservation.map(fecha => this.tablesService.getFloorPlanByDate(fecha));

        forkJoin(requestsPlans$).subscribe({
          next: (plans) => {
            this.tableNamesMap = {};
            const releaseTables: { customer: string; date: string }[] = [];
            plans.forEach((plan, index) => {
              const planDate = uniqueDatesWithReservation[index];
              if (!plan || !plan.layout_data) return;

              try {
                const layout = typeof plan.layout_data === 'string'
                  ? JSON.parse(plan.layout_data)
                  : plan.layout_data;

                if (layout && Array.isArray(layout.objects)) {
                  layout.objects.forEach((obj: any) => {
                    if (obj.data) {
                      const mesaId = String(obj.data.id || obj.data.table_id || '').trim();
                      const tableName = obj.data.nombre;

                      if (mesaId && tableName) this.tableNamesMap[mesaId] = tableName;

                      if (obj.data.customer_name && obj.data.customer_name.trim() !== '') {
                        const activeReservationsOfTheDay = reservations.filter(r =>
                          r.date === planDate && r.status !== 'cancelled'
                        );
                        const customers = obj.data.customer_name.split(' / ');

                        customers.forEach((customer: string) => {
                          const cleanName = customer.trim();
                          if (!cleanName) return;

                          const hasActiveReservation = activeReservationsOfTheDay.some(r =>
                            r.name?.trim().toLowerCase() === cleanName.toLowerCase()
                          );

                          const alreadyAdded = releaseTables.some(m => m.customer === cleanName && m.date === planDate);
                          if (!hasActiveReservation && !alreadyAdded) {
                            releaseTables.push({ customer: cleanName, date: planDate });
                          }
                        });
                      }
                    }
                  });
                }
              } catch (e) {
                console.error('Error al parsear layout_data:', e);
              }
            });

            if (releaseTables.length > 0) {
              console.warn(`🧹 Auditoría: Se detectaron mesas inconsistentes ocupadas. Liberando...`, releaseTables);
              const releases$ = releaseTables.map(item =>
                this.tablesService.releaseTableByCustomer(item.customer, item.date)
              );
              forkJoin(releases$).subscribe({
                next: () => console.log('✨ Planos saneados en el servidor.'),
                error: (err) => console.error('Error en auto-limpieza:', err)
              });
            }

            const transformedData = reservations.map(res => {
              const mesaIdStr = res.table_id ? String(res.table_id).trim() : '';
              return {
                ...res,
                creator_name: res.creator_name?.trim() ? res.creator_name : 'WEB',
                table_name: this.tableNamesMap[mesaIdStr] || (res.table_id ? `Mesa ${res.table_id}` : 'Sin Mesa')
              };
            });

            this.allReservations.set(transformedData);
          },
          error: (err) => console.error('Error al recuperar los planos agregados:', err)
        });

      },
      error: (err) => console.error('Error al recuperar reservas:', err)
    });
  }

  async deleteReservation(id: number | undefined) {
    if (!id) return;

    const confirmed = await this.ui.confirm("¿Estás seguro de que deseas eliminar esta reserva?");
    if (!confirmed) return;

    const reservationToDelete = this.allReservations().find(res => res.id === id);

    this.reservationService.deleteReservation(id).pipe(
      switchMap(() => {
        if (reservationToDelete && reservationToDelete.table_id && reservationToDelete.name) {
          return this.tablesService.releaseTableByCustomer(reservationToDelete.name, reservationToDelete.date);
        }
        return forkJoin([]);
      })
    ).subscribe({
      next: () => {
        this.allReservations.update(list => list.filter(res => res.id !== id));
        this.ui.notify("Reserva eliminada y mesa liberada correctamente");
        this.loadData();
      },
      error: (err) => this.ui.handleError("No se pudo eliminar la reserva completamente", err)
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
