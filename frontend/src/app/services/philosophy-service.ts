import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Philosophy, PhilosophyUpdate } from '../common/interfaces/interfaces';
import { environment } from '../environment/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PhilosophyService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPhilosophies(): Observable<Philosophy[]> {
    return this.http.get<Philosophy[]>(
      `${this.apiUrl}philosophies`
    );
  }

  updatePhilosophy(id: number, data: PhilosophyUpdate): Observable<Philosophy> {
    const url = `${this.apiUrl}/philosophies/${id}`.replace(/([^:]\/)\/+/g, "$1");
    const body = {
      icon: data.icon,
      title: data.title,
      message: data.message
    };
    return this.http.put<Philosophy>(url, body);
  }
}
