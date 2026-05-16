import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ReservationsService} from '../../../../services/reservation-service';
import {AuthService} from '../../../../services/auth-service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ApiResponse, DayRule} from '../../../../common/interfaces/interfaces';
import {UiService} from '../../../../services/ui-service';
import {TablesService} from '../../../../services/tables_service';
import {of, switchMap} from 'rxjs';

@Component({
  selector: 'app-reservations-page',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './reservations-page.html',
  styleUrl: './reservations-page.css',
})
export class ReservationsPage implements OnInit {
  private readonly reservationService = inject(ReservationsService);
  public readonly auth = inject(AuthService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly ui = inject(UiService);
  public readonly tablesService = inject(TablesService);

  isAdminMode = signal<boolean>(false);
  dayRules = signal<DayRule[]>([]);
  closedDates = signal<string[]>([]);
  allTables = signal<any[]>([]);
  filteredTables = signal<any[]>([]);

  dynamicPeopleOptions = computed(() => {
    const min = this.isAdminMode() ? 1 : 2;
    const max = 10;
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  });

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  reservationForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/), Validators.maxLength(40)]],
    date: [this.formatDateLocal(new Date()), [Validators.required]],
    hour: ['', [Validators.required]],
    n_people: ['', [Validators.required]],
    notes: [''],
    table_id: [null]
  });

  private loadTablesForAdmin() {
    if (this.auth.isLeaderOrAdmin()) {
      const selectedDate = this.reservationForm.get('date')?.value;

      this.tablesService.getFloorPlanByDate(selectedDate).subscribe({
        next: (res) => {
          if (!res?.layout_data) {
            this.allTables.set([]);
            this.filteredTables.set([]);
            return;
          }

          const data = typeof res.layout_data === 'string'
            ? JSON.parse(res.layout_data)
            : res.layout_data;

          const tables = (data.objects || [])
            .filter((obj: any) => obj.data?.id)
            .map((obj: any) => ({
              id: obj.data.id,
              name: obj.data.nombre || obj.data.name || `Mesa ${obj.data.id}`
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

          this.allTables.set(tables);
          this.updateAvailableTables();
        },
        error: (err) => {
          console.error('Error cargando mesas', err);
          this.allTables.set([]);
        }
      });
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const isServiceAdmin = params['mode'] === 'admin' || this.auth.isLeaderOrAdmin();
      this.isAdminMode.set(isServiceAdmin);

      const nPeopleControl = this.reservationForm.get('n_people');
      nPeopleControl?.setValidators([Validators.required, Validators.min(isServiceAdmin ? 1 : 2)]);
      nPeopleControl?.updateValueAndValidity();

      this.loadTablesForAdmin();
    });

    this.reservationForm.get('date')?.valueChanges.subscribe(date => {
      if (date) {
        this.reservationForm.get('table_id')?.patchValue(null);
        this.loadTablesForAdmin();
        this.checkAvailability(date);
      }
    });

    this.reservationForm.get('n_people')?.valueChanges.subscribe(() => {
      this.updateAvailableTables();
    });

    this.reservationForm.get('hour')?.valueChanges.subscribe(hour => {
      if (hour) {
        this.updateAvailableTables();
      }
    });

    this.reservationService.getClosedDates().subscribe(dates => {
      this.closedDates.set(dates);
    });
    this.reservationService.getAdminSettings().subscribe(settings => {
      this.dayRules.set(settings.dayRules);
    });

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.reservationService.getReservationById(id).subscribe(res => {
        this.reservationForm.patchValue(res);
        if (res.date) this.selectedDate.set(new Date(res.date));
      });
    }
  }

  isSubmitting = signal<boolean>(false);
  viewDate = signal<Date>(new Date());
  selectedDate = signal<Date>(new Date());
  availableTimes = ['13:30', '15:30'];
  readonly todayMidnight = new Date(new Date().setHours(0,0,0,0));
  fullShifts = signal<string[]>([]);

  get r() { return this.reservationForm.controls; }

  calendarDays = computed(() => {
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let offset = firstDay.getDay() - 1;
    if (offset === -1) offset = 6;
    const days: (Date | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  });

  changeMonth(quantity: number) {
    const today = new Date();
    const current = this.viewDate();
    const nextDate = new Date(current.getFullYear(), current.getMonth() + quantity, 1);
    const limitDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    if (quantity > 0 && nextDate > limitDate) {
      alert("Se pueden realizar reservas solo de un mes de antelación");
      return;
    }
    if (quantity < 0 && nextDate < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    this.viewDate.set(nextDate);
  }

  isPast = (date: Date | null) => date ? date < this.todayMidnight : true;
  isSelected = (date: Date | null) => date?.toDateString() === this.selectedDate().toDateString();
  isToday = (date: Date | null) => date?.toDateString() === new Date().toDateString();

  isTimeDisabled(time: string): boolean {
    if (!this.isToday(this.selectedDate())) return false;
    const now = new Date();
    const [hour, minute] = time.split(':').map(Number);
    return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
  }

  selectDate(date: Date | null) {
    if (date && !this.isDateDisabled(date)) {
      this.selectedDate.set(date);
      const formattedDate = this.formatDateLocal(date);
      this.reservationForm.patchValue({ date: formattedDate });

      this.checkAvailability(formattedDate);

      const currentHour = this.reservationForm.get('hour')?.value;
      if (currentHour && this.isTimeDisabled(currentHour)) {
        this.reservationForm.patchValue({ hour: '' });
      }
    } else {
      this.reservationForm.patchValue({ hour: '' });
    }
  }

  private checkAvailability(date: string) {
    if (this.isAdminMode()) {
      this.fullShifts.set([]);
      return;
    }
    const n_people = Number(this.reservationForm.get('n_people')?.value) || 0;
    this.reservationService.getOccupancyByDate(date).subscribe({
      next: (occupancy: any[]) => {
        const full = occupancy
          .filter(item => (Number(item.total) + n_people) > Number(item.max))
          .map(item => item.hour);

        this.fullShifts.set(full);

        const currentHour = this.reservationForm.get('hour')?.value;
        if (currentHour && (full.includes(currentHour) || this.isTimeDisabled(currentHour))) {
          this.reservationForm.patchValue({ hour: '' });
        }
      },
      error: () => this.fullShifts.set([])
    });
  }

  onSubmit() {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.reservationForm.value;
    const payload = {
      ...formValue,
      n_people: Number(formValue.n_people)
    };

    this.reservationService.createReservation(payload).pipe(
      switchMap((res) => {
        if (this.isAdminMode() && formValue.table_id) {
          const customerInfo = {
            customer_name: formValue.name,
            customer_phone: formValue.phone,
            turno: formValue.hour
          };
          return this.tablesService.updateTableStatusInMap(
            formValue.table_id,
            'reserved',
            formValue.date,
            customerInfo
          ).pipe(
            switchMap(() => of(res))
          );
        }
        return of(res);
      })
    ).subscribe({
      next: (res) => this.reservationSent(res),
      error: (err) => this.reservationError(err)
    });
  }

  selectHour(time: string) {
    this.reservationForm.get('hour')?.setValue(time, { emitEvent: true });
    this.reservationForm.get('hour')?.markAsTouched();
    this.reservationForm.get('hour')?.updateValueAndValidity();
  }

  private reservationSent(res: ApiResponse): void {
    this.ui.notify('¡Reserva realizada con éxito!');
    const todayStr = this.formatDateLocal(new Date());
    this.reservationForm.reset({
      date: todayStr,
      n_people: 2,
      name: '',
      phone: '',
      notes: '',
      hour: ''
    });
    this.selectedDate.set(new Date());
    this.checkAvailability(todayStr);
  }

  private reservationError(err: any): void {
    this.ui.notify(err.error?.detail || 'Hubo un fallo al conectar con el servidor');
    this.isSubmitting.set(false);
  }

  getDaysOfWeek() {
    const baseDate = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      return new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
    });
  }
  daysOfWeek = this.getDaysOfWeek();

  isRestaurantClosed(date: Date | null): boolean {
    if (!date) return true;
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const rule = this.dayRules().find(r => r.day_of_week === dayIndex);
    return rule ? !rule.is_open : false;
  }

  isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    const dateISO = this.formatDateLocal(date);
    const past = this.isPast(date);
    const weeklyClosed = this.isRestaurantClosed(date);
    const specificallyBlocked = this.closedDates().includes(dateISO);
    return past || weeklyClosed || specificallyBlocked;
  }

  public updateAvailableTables() {
    const selectedDate = this.reservationForm.get('date')?.value;
    const selectedHour = this.reservationForm.get('hour')?.value;

    if (!this.isAdminMode() || !selectedDate || !selectedHour) {
      this.filteredTables.set(this.allTables());
      return;
    }

    this.reservationService.getOccupiedTables(selectedDate, selectedHour).subscribe({
      next: (occupiedTableIds: string[]) => {
        const available = this.allTables().filter(table =>
          !occupiedTableIds.includes(String(table.id))
        );
        this.filteredTables.set(available);

        const currentTable = this.reservationForm.get('table_id')?.value;
        if (currentTable && occupiedTableIds.includes(String(currentTable))) {
          this.reservationForm.get('table_id')?.patchValue(null);
        }
      }
    });
  }
}
