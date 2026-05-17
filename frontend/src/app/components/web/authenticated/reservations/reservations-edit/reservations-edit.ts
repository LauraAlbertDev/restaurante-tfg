import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Reservation, STATUS_LABELS } from '../../../../../common/interfaces/interfaces';
import { ReservationsService } from '../../../../../services/reservation-service';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, KeyValuePipe, NgClass } from '@angular/common';
import { FormValidators } from '../../../../../Validators/FormValidators';
import { formatDateToISO } from '../../../../../common/utils/date-utils';
import { UiService } from '../../../../../services/ui-service';
import { TablesService } from '../../../../../services/tables_service';
import { AuthService } from '../../../../../services/auth-service';
import { switchMap, of, forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-reservations-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    NgClass,
    KeyValuePipe
  ],
  templateUrl: './reservations-edit.html',
  styleUrl: './reservations-edit.css',
})
export class ReservationsEdit implements OnInit {
  @Input() id?: number;

  private readonly reservationService = inject(ReservationsService);
  private readonly tablesService = inject(TablesService);
  protected readonly authService = inject(AuthService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  minDate: string = '';
  isAuthMode: boolean = false;
  statusLabels = STATUS_LABELS;

  allTables = signal<any[]>([]);
  filteredTables = signal<any[]>([]);

  private originalReservation: Reservation | null = null;

  formReservation: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(30)]],
    date: ['', [Validators.required]],
    hour: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    rices: [''],
    n_people: [2, [Validators.required, Validators.min(2)]],
    notes: [''],
    status: ['unconfirmed', Validators.required],
    table_id: [null]
  });

  get r() { return this.formReservation.controls; }

  ngOnInit() {
    this.isAuthMode = this.router.url.includes('/auth/');
    this.minDate = formatDateToISO(new Date());

    this.setupDynamicValidators();

    // 🔄 ESCUCHADORES REACTIVOS CONTROLADOS
    this.formReservation.get('date')?.valueChanges.subscribe(date => {
      if (date && this.originalReservation) {
        if (date !== this.originalReservation.date) {
          this.formReservation.get('table_id')?.patchValue(null, { emitEvent: false });
        }
        this.loadTablesForDate(date);
      }
    });

    this.formReservation.get('hour')?.valueChanges.subscribe(() => {
      this.updateAvailableTables();
    });

    if (this.id) {
      this.loadReservation(Number(this.id));
    }
  }

  private loadReservation(id: number) {
    this.reservationService.getReservationById(id).subscribe({
      next: (data) => {
        this.originalReservation = data;

        const sanitizedData = {
          ...data,
          table_id: data.table_id ? String(data.table_id).trim() : null
        };

        // Cargamos los datos iniciales silenciando eventos mutuos
        this.formReservation.patchValue(sanitizedData, { emitEvent: false });

        if (sanitizedData.date) {
          this.loadTablesForDate(sanitizedData.date);
        } else {
          console.warn('⚠️ La reserva no tiene una fecha válida asignada.');
        }
      },
      error: (err) => this.ui.handleError('Error al cargar la reserva', err)
    });
  }

  private loadTablesForDate(date: string) {
    this.tablesService.getFloorPlanByDate(date).subscribe({
      next: (res) => {
        if (!res?.layout_data) {
          this.allTables.set([]);
          this.filteredTables.set([]);
          return;
        }

        const data = typeof res.layout_data === 'string' ? JSON.parse(res.layout_data) : res.layout_data;

        const tables = (data.objects || [])
          .filter((obj: any) => obj.data?.id)
          .map((obj: any) => ({
            id: String(obj.data.id).trim(),
            name: obj.data.nombre || obj.data.name || `Mesa ${obj.data.id}`
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        this.allTables.set(tables);
        this.updateAvailableTables();
      },
      error: (err) => console.error('❌ Error crítico en loadTablesForDate:', err)
    });
  }

  private updateAvailableTables() {
    const selectedDate = this.formReservation.get('date')?.value;
    const selectedHour = this.formReservation.get('hour')?.value;

    if (!selectedDate || !selectedHour) {
      this.filteredTables.set(this.allTables());
      return;
    }

    this.reservationService.getOccupiedTables(selectedDate, selectedHour).subscribe({
      next: (occupiedTableIds: any[]) => {
        const currentAssignedTableId = this.originalReservation?.table_id ? String(this.originalReservation.table_id).trim() : null;

        const rawIds = Array.isArray(occupiedTableIds) ? occupiedTableIds : Object.values(occupiedTableIds || {});
        const occupiedIds = rawIds.map(id => String(id).trim());

        const isSameSlotAsOriginal = this.originalReservation &&
          selectedDate === this.originalReservation.date &&
          selectedHour === this.originalReservation.hour;

        const available = this.allTables().filter(table => {
          const mesaIdStr = String(table.id).trim();
          const isOccupied = occupiedIds.includes(mesaIdStr);

          // Si es su propia mesa en su propio turno, DEBE mostrarse siempre
          const isItsOwnTable = isSameSlotAsOriginal && (currentAssignedTableId === mesaIdStr);

          return !isOccupied || isItsOwnTable;
        });

        // 1. Rellenamos las mesas del selector
        this.filteredTables.set(available);

        // 2. 🌟 SOLUCIÓN CLAVE: Si la reserva actual tiene una mesa asignada, forzamos a Angular
        // a re-establecer el valor en el siguiente ciclo de renderizado (macro-task)
        if (currentAssignedTableId) {
          setTimeout(() => {
            this.formReservation.get('table_id')?.setValue(currentAssignedTableId, {
              emitEvent: false,
              onlySelf: true
            });
          }, 0);
        }
      },
      error: () => this.filteredTables.set(this.allTables())
    });
  }

  async onSubmit() {
    if (this.formReservation.invalid || !this.id || !this.originalReservation) {
      this.formReservation.markAllAsTouched();
      return;
    }

    const rawData = this.formReservation.value;

    if (rawData.table_id !== null && rawData.table_id !== undefined && rawData.table_id !== '') {
      rawData.table_id = String(rawData.table_id).trim();
    } else {
      rawData.table_id = null;
    }

    if (rawData.status === 'confirmed' && !rawData.rices?.trim()) {
      this.ui.handleError("No puedes confirmar una reserva sin indicar los arroces.");
      return;
    }

    // 🔴 CASO 1: RESERVA CANCELADA (Liberamos usando los datos de la reserva ORIGINAL)
    if (rawData.status === 'cancelled') {
      const confirmCancel = await this.ui.confirm(
        '¿Estás seguro de cancelar? La mesa quedará completamente libre para este turno.'
      );
      if (!confirmCancel) return;

      if (this.originalReservation.table_id) {
        // 🌟 CLAVE: Usamos el nombre ORIGINAL que está grabado en el mapa
        this.tablesService.releaseTableByCustomer(this.originalReservation.name, this.originalReservation.date).subscribe({
          next: () => {
            rawData.table_id = null;
            this.saveUpdatedReservation(rawData);
          },
          error: (err) => this.ui.handleError('Error al vaciar la mesa del mapa', err)
        });
      } else {
        rawData.table_id = null;
        this.saveUpdatedReservation(rawData);
      }
      return;
    }

    // 🌟 IDENTIFICADORES DE MESAS (Strings limpios)
    const oldTableId = this.originalReservation.table_id ? String(this.originalReservation.table_id).trim() : null;
    const newTableId = rawData.table_id ? String(rawData.table_id).trim() : null;

    // Información nueva que se pintará en la NUEVA mesa
    const newCustomerInfo = {
      customer_name: rawData.name,
      customer_phone: rawData.phone,
      turno: rawData.hour,
      notes: rawData.notes
    };

    let mapSync$: Observable<any> = of(null);

    // 🔄 CASO A: Ha cambiado de mesa (Pasamos de una mesa A a una mesa B)
    if (oldTableId !== newTableId) {
      const tasks = [];

      if (oldTableId) {
        // 🌟 CLAVE: Para borrar la mesa vieja, usamos el nombre ORIGINAL que tenía asignado en Fabric
        tasks.push(this.tablesService.releaseTableByCustomer(this.originalReservation.name, this.originalReservation.date));
      }

      if (newTableId) {
        // Para pintar la mesa nueva, usamos los datos NUEVOS del formulario
        tasks.push(this.tablesService.updateTableStatusInMap(newTableId, 'reserved', rawData.date, newCustomerInfo));
      }

      if (tasks.length > 0) mapSync$ = forkJoin(tasks);
    }

    // 🔄 CASO B: Mantiene la misma mesa pero cambió algún dato (Nombre, Teléfono o Turno)
    else if (newTableId && (
      this.originalReservation.name !== rawData.name ||
      this.originalReservation.phone !== rawData.phone ||
      this.originalReservation.hour !== rawData.hour
    )) {
      // 🌟 CLAVE: Borramos el rastro del mapa con el nombre ORIGINAL y repintamos con el NUEVO
      mapSync$ = this.tablesService.releaseTableByCustomer(this.originalReservation.name, this.originalReservation.date).pipe(
        switchMap(() => this.tablesService.updateTableStatusInMap(newTableId, 'reserved', rawData.date, newCustomerInfo))
      );
    }

    // Ejecutamos la sincronización del plano y luego guardamos en la Base de Datos
    mapSync$.subscribe({
      next: () => this.saveUpdatedReservation(rawData),
      error: (err) => this.ui.handleError('Error sincronizando el mapa de mesas', err)
    });
  }

  private saveUpdatedReservation(rawData: any) {
    const reservationData: Reservation = {
      ...rawData,
      id: Number(this.id)
    };

    this.reservationService.updateReservation(Number(this.id), reservationData).subscribe({
      next: () => {
        this.ui.notify('Reserva actualizada correctamente');
        this.router.navigate(['/auth/reservations-list']);
      },
      error: (err) => this.ui.handleError('No se pudo actualizar la reserva', err)
    });
  }

  private setupDynamicValidators() {
    const dateControl = this.formReservation.get('date');
    const peopleControl = this.formReservation.get('n_people');

    dateControl?.setValidators([Validators.required, FormValidators.minDate(this.minDate)]);
    peopleControl?.setValidators([Validators.required, Validators.min(this.isAuthMode ? 1 : 2)]);
    this.formReservation.updateValueAndValidity();
  }

  protected getStatusLabel(status: string) {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || 'Desconocido';
  }
}
