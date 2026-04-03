import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ReservationsService} from '../../../../services/reservation-service';
import {AuthService} from '../../../../services/auth-service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ApiResponse, DayRule} from '../../../../common/interfaces/interfaces';
import {UiService} from '../../../../services/ui-service';

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
  isAdminMode = signal<boolean>(false);
  dayRules = signal<DayRule[]>([]);
  closedDates = signal<string[]>([]);
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
    notes: ['']
  });

  ngOnInit() {

    this.reservationService.getClosedDates().subscribe(dates => {
      this.closedDates.set(dates);
    });
    this.reservationService.getAdminSettings().subscribe(settings => {
      this.dayRules.set(settings.dayRules); // El array de 0 a 6 con is_open
    });
    this.route.queryParams.subscribe(params => {
      const userRole = this.auth.getType();
      const isServiceAdmin = params['mode'] === 'admin' || userRole === 'admin' || userRole === 'employee';
      this.isAdminMode.set(isServiceAdmin);

      // Ajustar validadores de personas si es admin
      const nPeopleControl = this.reservationForm.get('n_people');
      if (isServiceAdmin) {
        nPeopleControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        nPeopleControl?.setValidators([Validators.required, Validators.min(2)]);
      }
      nPeopleControl?.updateValueAndValidity();
    });

    // 2. Cargar datos si es edición (esto ya lo tenías bien)
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.reservationService.getReservationById(id).subscribe(res => {
        this.reservationForm.patchValue(res);
        this.selectedDate.set(new Date(res.date));
      });
    }

    // 3. Escuchar cambios para disponibilidad
    this.reservationForm.get('n_people')?.valueChanges.subscribe(() => {
      const date = this.reservationForm.get('date')?.value;
      if (date) this.checkAvailability(date);
    });
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
      // Opcional: limpiar la hora si el admin selecciona un día bloqueado
      this.reservationForm.patchValue({ hour: '' });
    }
  }

  private checkAvailability(date: string) {
    if (this.isAdminMode()) {
      this.fullShifts.set([]); // Nada está "lleno" para el admin
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
        if (full.includes(currentHour)) {
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

    this.reservationService.createReservation(this.reservationForm.value).subscribe({
      next: (res) => this.reservationSent(res),
      error: (err) => this.reservationError(err)
    });
  }

  selectHour(time: string) {
    this.reservationForm.patchValue({ hour: time });
    this.reservationForm.get('hour')?.markAsTouched();
    this.reservationForm.get('hour')?.updateValueAndValidity();
  }

  private reservationSent(res: ApiResponse): void {
    this.ui.handleError('¡Reserva realizada con éxito!');
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
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Ajuste para que 0 sea Lunes
    const rule = this.dayRules().find(r => r.day_of_week === dayIndex);
    return rule ? !rule.is_open : false;
  }

// Actualizamos isPast para que también bloquee días cerrados
  isDateDisabled = (date: Date | null) => {
    if (!date) return true;

    const dateISO = this.formatDateLocal(date);

    // 1. ¿Es una fecha pasada?
    const past = this.isPast(date);

    // 2. ¿Es un día cerrado por regla semanal (ej: todos los lunes)?
    const weeklyClosed = this.isRestaurantClosed(date);

    // 3. ¿Es una fecha bloqueada específicamente por el admin (special_days)?
    const specificallyBlocked = this.closedDates().includes(dateISO);

    // Si cualquiera de estas es verdadera, el día debe estar deshabilitado
    return past || weeklyClosed || specificallyBlocked;
  }
  unblockDate(date: string) {
    this.reservationService.deleteSpecialDay(date).subscribe({
      next: () => {
        this.ui.notify('Día habilitado correctamente');
        this.closedDates.set(this.closedDates().filter(d => d !== date));

      },
      error: (err) => this.ui.handleError('No se pudo habilitar el día', err)
    });
  }
}
