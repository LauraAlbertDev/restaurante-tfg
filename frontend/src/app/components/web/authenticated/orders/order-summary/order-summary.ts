import {Component, computed, inject} from '@angular/core';
import {CurrencyPipe, JsonPipe, NgClass} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import { OrderService } from '../../../../../services/order-service';
import {UiService} from '../../../../../services/ui-service';

@Component({
  selector: 'app-order-summary',
  imports: [
    CurrencyPipe,
    RouterLink,
    JsonPipe,
    NgClass
  ],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css',
})
export class OrderSummary {
  public orderService: OrderService = inject(OrderService);
  public ui : UiService = inject(UiService);
  private router: Router = inject(Router);

  public orderOptions = [
    { action: 'deleteOne', icon: 'dash', color: 'btn-outline-secondary', title: 'Quitar uno'},
    { action: 'addItemToOrder', icon: 'plus', color: 'btn-outline-secondary', title: 'Añadir uno' },
    { action: 'deleteFromOrder', icon: 'trash', color: 'btn-outline-danger', title: 'Eliminar del pedido'}
  ];

  ejecutarAccion(action: string, item: any) {
    const service = this.orderService as any;
    if (action === 'addItemToOrder') service[action](item);
    else service[action](item.id);
  }

  public items = computed(() => this.orderService.currentOrderItems());

  public total = computed(() => this.orderService.orderTotal());

  public deleteTable(id: string) {
    if (confirm('¿Deseas cancelar todo el pedido de esta mesa?')) {
      this.orderService.clearOrder(id);
      this.router.navigate(['/auth/mesas']);
    }
  }
}
