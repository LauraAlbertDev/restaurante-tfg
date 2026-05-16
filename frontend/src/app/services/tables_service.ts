import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { STATUS_COLORS } from '../common/interfaces/interfaces';
import {environment} from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  private readonly http = inject(HttpClient);
  getFloorPlanByDate(date: string | null): Observable<any> {
    const url = date
      ? `${environment.apiUrl}floor-plans/floor-plan?date=${date}`
      : `${environment.apiUrl}floor-plans/floor-plan`;
    return this.http.get<any>(url);
  }

  saveTemplatePlan(areaName: string, layoutData: any): Observable<any> {
    const payload = {
      name: areaName,
      layout_data: layoutData,
      fecha: null
    };
    return this.http.post(`${environment.apiUrl}floor-plans/floor-plan/daily`, payload);
  }

  saveDailyPlan(areaName: string, layoutData: any, date: string): Observable<any> {
    const payload = {
      name: areaName,
      layout_data: layoutData,
      fecha: date
    };
    return this.http.post(`${environment.apiUrl}floor-plans/floor-plan/daily`, payload);
  }

  updateTableStatusInMap(table_id: string, status: string, date: string, customerData?: any): Observable<any> {
    return this.getFloorPlanByDate(date).pipe(
      switchMap(plan => {
        if (!plan?.layout_data) return of(null);

        const data = typeof plan.layout_data === 'string'
          ? JSON.parse(plan.layout_data)
          : plan.layout_data;

        data.objects = data.objects.map((obj: any) => {
          if (String(obj.data?.id) === String(table_id)) {

            let finalStatus = status;

            if (status === 'reserved' && (obj.data.status === 'reserved' || obj.data.status === 'double_reserved')) {
              finalStatus = 'double_reserved';
            }

            obj.data.status = finalStatus;
            obj.data.estado = finalStatus;

            const targetColor = STATUS_COLORS[finalStatus] || STATUS_COLORS['available'];

            if (customerData) {
              const newName = customerData.customer_name || customerData.name || '';
              obj.data.customer_name = obj.data.customer_name
                ? `${obj.data.customer_name} / ${newName}`
                : newName;

              const newPhone = customerData.customer_phone || '';
              obj.data.customer_phone = obj.data.customer_phone && obj.data.customer_phone !== newPhone
                ? `${obj.data.customer_phone} / ${newPhone}`
                : newPhone;

              const newTurno = customerData.turno || '';
              obj.data.turno = obj.data.turno && obj.data.turno !== newTurno
                ? `${obj.data.turno} / ${newTurno}`
                : newTurno;

              obj.data.notes = obj.data.notes
                ? `${obj.data.notes} | ${customerData.notes}`
                : (customerData.notes || '');
            }

            if (obj.objects) {
              obj.objects.forEach((child: any) => {
                if (child.type !== 'i-text' && child.type !== 'text') child.fill = targetColor;
              });
            }
          }
          return obj;
        });
        return this.saveDailyPlan(plan.area_name || 'Salón', data, date);
      })
    );
  }

  releaseTableByCustomer(customerName: string, date: string): Observable<any> {
    return this.getFloorPlanByDate(date).pipe(
      switchMap(plan => {
        if (!plan?.layout_data) return of(null);

        const data = typeof plan.layout_data === 'string'
          ? JSON.parse(plan.layout_data)
          : plan.layout_data;

        let tableFound = false;

        data.objects = data.objects.map((obj: any) => {
          if (obj.data?.customer_name?.includes(customerName)) {
            tableFound = true;

            if (obj.data.customer_name.includes(' / ')) {
              const names = obj.data.customer_name.split(' / ').map((n: string) => n.trim());
              const phones = (obj.data.customer_phone || '').split(' / ').map((p: string) => p.trim());
              const turnos = (obj.data.turno || '').split(' / ').map((t: string) => t.trim());
              const idx = names.indexOf(customerName);
              if (idx !== -1) {
                names.splice(idx, 1);
                if (phones.length > idx) phones.splice(idx, 1);
                if (turnos.length > idx) turnos.splice(idx, 1);
              }

              obj.data.customer_name = names.join(' / ');
              obj.data.customer_phone = phones.join(' / ');
              obj.data.turno = turnos.join(' / ');
              obj.data.status = 'reserved';
              obj.data.estado = 'reserved';
            } else {
              obj.data.customer_name = '';
              obj.data.customer_phone = '';
              obj.data.turno = '';
              obj.data.notes = '';
              obj.data.status = 'available';
              obj.data.estado = 'available';
              obj.data.n_people = 0;
            }

            const targetColor = STATUS_COLORS[obj.data.status] || STATUS_COLORS['available'];
            if (obj.objects) {
              obj.objects.forEach((child: any) => {
                if (child.type !== 'i-text' && child.type !== 'text') child.fill = targetColor;
              });
            }
          }
          return obj;
        });

        if (!tableFound) return of(null);
        return this.saveDailyPlan(plan.area_name || 'Salón', data, date);
      })
    );
  }


  setTableAsReservedEmpty(tableId: string | number, date: string): Observable<any> {
    return this.getFloorPlanByDate(date).pipe(
      switchMap(plan => {
        if (!plan?.layout_data) return of(null);

        const data = typeof plan.layout_data === 'string'
          ? JSON.parse(plan.layout_data)
          : plan.layout_data;

        let tableFound = false;

        data.objects = data.objects.map((obj: any) => {
          if (obj.data && String(obj.data.id) === String(tableId)) {
            tableFound = true;

            // Vaciamos los campos de texto del cliente por completo
            obj.data.customer_name = '';
            obj.data.customer_phone = '';
            obj.data.turno = '';
            obj.data.notes = '';

            // Forzamos el estado visual estable a Reservado
            obj.data.status = 'reserved';
            obj.data.estado = 'reserved';

            // Actualizamos los colores de los vectores del Canvas (Fabric.js) inmediatamente
            const targetColor = STATUS_COLORS['reserved'] || '#FFC107';
            if (obj.objects) {
              obj.objects.forEach((child: any) => {
                if (child.type !== 'i-text' && child.type !== 'text') child.fill = targetColor;
              });
            }
          }
          return obj;
        });

        if (!tableFound) return of(null);
        return this.saveDailyPlan(plan.area_name || 'Salón principal', data, date);
      })
    );
  }
}
