import {Component, computed, inject} from '@angular/core';
import {OrderService} from '../../../../../services/order-service';
import {CurrencyPipe, JsonPipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {UiService} from '../../../../../services/ui-service';
import {ReservationsService} from '../../../../../services/reservation-service';
declare var bootstrap: any;
@Component({
  selector: 'app-order-resume',
  imports: [
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './order-resume.html',
  styleUrl: './order-resume.css',
})
export class OrderResume {
  public orderService = inject(OrderService);
  public reservationService = inject(ReservationsService);
  private readonly ui = inject(UiService);
  public router = inject(Router);

  protected selectedTableId: string | null = null;
  protected selectedTableName: string = '';

  public activeOrders = computed(() => this.orderService.allActiveOrders());

  public openFinalizarModal(table_id: string, tableName: string) {
    this.selectedTableId = table_id;
    this.selectedTableName = tableName;

    const modalElement = document.getElementById('finalizeOrderModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
  }

  public async confirmFinalizar() {
    if (!this.selectedTableId) return;

    try {
      // 1. Limpiamos la comanda
      this.orderService.clearOrder(this.selectedTableId);

      // 2. Buscamos la reserva activa de esta mesa para el día de hoy
      const todasLasReservas = await this.reservationService.getReservations().toPromise() || [];
      const hoy = new Date().toISOString().split('T')[0]; // Ajusta según tu formato de fecha

      const reserva = todasLasReservas.find(r =>
        String(r.table_id) === String(this.selectedTableId) &&
        r.date === hoy &&
        r.status !== 'cancelled' &&
        r.status !== 'completed'
      );

      // 3. Si encontramos reserva, la marcamos como completada
      if (reserva) {
        await this.reservationService.updateReservationStatus(reserva.id, 'completed').toPromise();
        this.ui.notify("Pedido finalizado y reserva marcada como completada");
      } else {
        this.ui.notify("Pedido finalizado correctamente");
      }

      // El mapa se actualizará automáticamente gracias al effect que ya tienes
    } catch (error) {
      console.error("Error al finalizar pedido:", error);
      this.ui.handleError("Hubo un problema al cerrar la mesa");
    }
  }
}

