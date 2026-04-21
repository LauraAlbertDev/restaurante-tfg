import {Component, inject, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Reservation, STATUS_LABELS, UserComment} from '../../../../../common/interfaces/interfaces';
import {ReservationsService} from '../../../../../services/reservation-service';
import {Router, RouterLink} from '@angular/router';
import {DatePipe, KeyValuePipe, NgClass, TitleCasePipe} from '@angular/common';
import {FormValidators} from '../../../../../Validators/FormValidators';
import {formatDateToISO} from '../../../../../common/utils/date-utils';
import {UiService} from '../../../../../services/ui-service';

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
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  minDate: string = '';
  isAuthMode: boolean = false;
  statusLabels = STATUS_LABELS;

  formReservation: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(30)]],
    date: ['', [Validators.required]],
    hour: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    n_people: [2, [Validators.required, Validators.min(2)]],
    notes: [''],status: ['unconfirmed', Validators.required]
  });
  get r() { return this.formReservation.controls; }

  ngOnInit() {
    this.isAuthMode = this.router.url.includes('/auth/');
    this.minDate = formatDateToISO(new Date());
    this.setupDynamicValidators();
    this.formReservation.get('date')?.setValidators([
      Validators.required,
      FormValidators.minDate(this.minDate)
    ]);
    if (this.id) this.loadReservation(Number(this.id));
  }

  private loadReservation(id: number) {
    this.reservationService.getReservationById(id).subscribe({
      next: (data) => this.formReservation.patchValue(data),
      error: (err) => this.ui.handleError('Error al cargar comentario', err)
    });
  }


  onSubmit() {
    if (this.formReservation.invalid || !this.id) {
      this.formReservation.markAllAsTouched();
      return;
    }

    const reservationData: Reservation = {
      ...this.formReservation.value,
      id: Number(this.id)
    };

    this.reservationService.updateReservation(Number(this.id), reservationData).subscribe({
      next: () => this.router.navigate(['/auth/reservations-list']),
      error: (err) => console.error(err)
    });
  }


  private setupDynamicValidators() {
    const dateControl = this.formReservation.get('date');
    const peopleControl = this.formReservation.get('n_people');

    dateControl?.setValidators([
      Validators.required,
      FormValidators.minDate(this.minDate)
    ]);

    if (this.isAuthMode) {
      peopleControl?.setValidators([Validators.required, Validators.min(1)]);
    }else {
      peopleControl?.setValidators([Validators.required, Validators.min(2)]);
    }

    this.formReservation.updateValueAndValidity();
  }

  protected getStatusLabel(status: string) {
    // Aquí forzamos a que TS entienda que status es una llave válida
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || 'Desconocido';
  }
}
