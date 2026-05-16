import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from "@angular/common";
import { ReservationsService } from '../../../../../services/reservation-service';
import { TablesService } from '../../../../../services/tables_service';
import { Reservation, STATUS_CONFIG } from '../../../../../common/interfaces/interfaces';
import { map, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-reservations-detail',
  imports: [DatePipe, NgClass],
  templateUrl: './reservations-detail.html',
  styleUrl: './reservations-detail.css',
})
export class ReservationsDetail implements OnInit {
  @Input('id') idReservation?: number;

  private readonly reservationService = inject(ReservationsService);
  private readonly tablesService = inject(TablesService);
  protected readonly config = STATUS_CONFIG;

  reservation = signal<Reservation | null>(null);
  loaded = signal<boolean>(false);

  ngOnInit() {
    if (!this.idReservation) return;

    this.reservationService.getReservationById(this.idReservation).pipe(
      switchMap(res => {
        if (!res?.table_id || !res.date) return of(res);

        return this.tablesService.getFloorPlanByDate(res.date).pipe(
          map(plan => {
            const layout = typeof plan?.layout_data === 'string' ? JSON.parse(plan.layout_data) : plan?.layout_data;
            const mesa = layout?.objects?.find((o: any) => String(o.data?.id || o.data?.table_id) === String(res.table_id));

            return {
              ...res,
              table_name: mesa?.data?.name || mesa?.data?.nombre || mesa?.data?.number || `Mesa ${res.table_id}`
            };
          })
        );
      })
    ).subscribe({
      next: (r) => { this.reservation.set(r); this.loaded.set(true); },
      error: () => this.loaded.set(true)
    });
  }
}
