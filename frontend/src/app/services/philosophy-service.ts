import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Philosophy, PhilosophyUpdate } from '../common/interfaces';
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
    // 1. Aseguramos que la URL sea correcta (evitamos el error de la barra)
    const url = `${this.apiUrl}/philosophies/${id}`.replace(/([^:]\/)\/+/g, "$1");

    // 2. Limpiamos el objeto para enviar SOLO lo que pide el DTO de Python
    // Si envías algo que no está en el modelo Pydantic, FastAPI lanza el 422
    const body = {
      icon: data.icon,
      title: data.title,
      message: data.message
    };

    console.log('Enviando a:', url);
    console.log('Cuerpo del delito:', body);

    return this.http.put<Philosophy>(url, body);
  }
}
