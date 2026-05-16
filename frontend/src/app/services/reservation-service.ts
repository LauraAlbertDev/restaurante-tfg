import {inject, Injectable} from '@angular/core';
import {environment} from '../environment/environment';
import {HttpClient} from '@angular/common/http';
import { Observable} from 'rxjs';
import {ApiResponse, Reservation, UserComment} from '../common/interfaces/interfaces';
import {FormGroup} from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ReservationsService {
  private readonly http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}reservations/`;

  createReservation(reserva: FormGroup): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, reserva);
  }

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.apiUrl);
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}${id}`);
  }

  updateReservation(id: number, reservation: Reservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}update/${id}`, reservation);
  }

  deleteReservation(id: number): Observable<Reservation> {
    return this.http.delete<Reservation>(`${this.apiUrl}${id}`);
  }

  getOccupancyByDate(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}occupancy/${date}`);
  }

  getAdminSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/settings`);
  }

  saveDayLimit(dayIndex: number, limit: number ,is_open: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}admin/update-day`, {
      day: dayIndex,
      limit: limit,
      is_open: is_open,
    });
  }

  addShift(time: string): Observable<any> {
    return this.http.post(`${this.apiUrl}admin/shifts/add`, {
      time: time
    });
  }

  removeShift(shiftId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}admin/shifts/${shiftId}`);
  }

  getClosedDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}closed-dates`);
  }

  saveSpecialDay(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}admin/special-day`, data);
  }

  deleteSpecialDay(date: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}admin/special-day/${date}`);
  }

  getOccupiedTables(date: string, hour: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}occupied-tables`, {
      params: { date, hour }
    });
  }
}
