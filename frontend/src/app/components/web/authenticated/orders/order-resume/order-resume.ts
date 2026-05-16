import {Component, computed, inject} from '@angular/core';
import {OrderService} from '../../../../../services/order-service';
import {CurrencyPipe, JsonPipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {UiService} from '../../../../../services/ui-service';

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
  private readonly ui = inject(UiService);
  public router = inject(Router);
  public activeOrders = computed(() => this.orderService.allActiveOrders());

  public async finalizarPedido(table_id: string, tableName: string) {
    const confirmed = await this.ui.confirm("¿Estás seguro de que deseas eliminar la " + tableName + "?");
      if (confirmed) this.orderService.clearOrder(table_id);
    }

}

