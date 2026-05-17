import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {ActiveOrder, OrderItem} from '../common/interfaces/interfaces';
import {UiService} from './ui-service';
import {Subject} from 'rxjs';
import {ProductService} from './product-service';
import {TablesService} from './tables_service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly ui = inject(UiService);
  private readonly productsService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly tablesService = inject(TablesService);

  private readonly ordersItemsSignal: WritableSignal<Map<string, { name: string; items: OrderItem[] }>> = signal(new Map());

  private readonly tableReleasedSource = new Subject<string>();
  public readonly tableReleased$ = this.tableReleasedSource.asObservable();
  public readonly activeTable = signal<{ id: string; name: string, data?: any } | null>(null);

  public currentOrderItems = computed(() => {
    const table = this.activeTable();
    if (!table) return [];
    return this.ordersItemsSignal().get(table.id)?.items || [];
  });

  public orderTotal = computed(() => {
    return this.currentOrderItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  public allActiveOrders = computed<ActiveOrder[]>(() => {
    const currentMap = this.ordersItemsSignal();

    return Array.from(currentMap.entries()).map(([id, data]) => {
      return {
        table_id: id,
        tableName: data.name,
        items: [...data.items],
        total: data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      };
    });
  });

  constructor() {
    const saved = localStorage.getItem('pedidos_restaurante');
    const savedTable = localStorage.getItem('active_table_session');

    if (savedTable) {
      try {
        this.activeTable.set(JSON.parse(savedTable));
      } catch (e) {
        console.error("Error parseando active_table_session", e);
      }
    }

    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        this.ordersItemsSignal.set(new Map(parsedData));
      } catch (e) {
        console.error("Error cargando pedidos", e);
      }
    }

    window.addEventListener('storage', (event) => {
      if (event.key === 'pedidos_restaurante') {
        const rawData = event.newValue;
        if (rawData) {
          const parsed = JSON.parse(rawData);
          this.ordersItemsSignal.set(new Map(parsed));
        }
      }
    });
  }

  setActiveTable(id: string, name: string, data?: any): void {
    const tableObj = { id, name, data };
    this.activeTable.set(tableObj);
    localStorage.setItem('active_table_session', JSON.stringify(tableObj));
  }

  addItemToOrder(product: any) {
    const table = this.activeTable();
    if (!table) {
      this.ui.notify("No hay mesa seleccionada");
      return;
    }

    this.productsService.updateStockOnServer(product.id, -1).subscribe({
      next: () => {
        this.ordersItemsSignal.update(map => {
          const newMap = new Map(map);
          const currentData = newMap.get(table.id) || { name: table.name, items: [] };

          const existingIndex = currentData.items.findIndex(i => i.id === product.id);
          let newItems = [...currentData.items];

          if (existingIndex > -1) {
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + 1
            };
          } else {
            newItems.push({
              id: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              timestamp: new Date()
            });
          }

          newMap.set(table.id, { name: table.name, items: newItems });
          this.save(newMap);
          return newMap;
        });
      },
      error: (err) => {
        const errorMsg = err.error?.detail || err.error?.message;
        if (errorMsg && (errorMsg.toLowerCase().includes('stock') || errorMsg.toLowerCase().includes('existencias'))) {
          this.ui.handleError(`No queda stock disponible para: ${product.name}`);
        } else if (err.status === 400 || err.status === 409) {
          this.ui.handleError(`Agotado: ${product.name} no tiene suficiente stock.`);
        } else {
          this.ui.handleError('Error al actualizar stock');
        }
      }
    });
  }

  clearOrder(table_id: string): void {
    const orderData = this.ordersItemsSignal().get(table_id);
    if (!orderData) return;

    orderData.items.forEach(item => {
      this.productsService.updateStockOnServer(item.id, item.quantity).subscribe();
    });

    this.ordersItemsSignal.update(map => {
      const newMap = new Map(map);
      newMap.delete(table_id);
      this.save(newMap);
      return newMap;
    });

    const today = new Date().toISOString().split('T')[0];

    this.tablesService.updateTableStatusInMap(table_id, 'available', today).subscribe({
      next: () => {
        this.tableReleasedSource.next(table_id);
      },
      error: (err) => console.error('Error al liberar mesa en el servidor:', err)
    });

    if (this.activeTable()?.id === table_id) {
      this.activeTable.set(null);
    }
  }

  private save(map: Map<string, any>) {
    localStorage.setItem('pedidos_restaurante', JSON.stringify(Array.from(map.entries())));
  }

  navigateToTable(id: string, nombre: string, data?: any): void {
    this.setActiveTable(id, nombre, data);
    this.router.navigate(['/menu'], {
      queryParams: { table_id: id, tableName: nombre }
    });
  }

  deleteFromOrder(productId: string): void {
    const table = this.activeTable();
    if (!table) return;

    this.ordersItemsSignal.update(map => {
      const newMap = new Map(map);
      const tableData = newMap.get(table.id);

      if (tableData) {
        const item = tableData.items.find(i => i.id === productId);
        if (item) this.productsService.updateStock(productId, item.quantity);
        tableData.items = tableData.items.filter(i => i.id !== productId);
        newMap.set(table.id, tableData);
        this.save(newMap);
      }
      return newMap;
    });
  }

  deleteOne(productId: string): void {
    const table = this.activeTable();
    if (!table) return;

    this.productsService.updateStockOnServer(productId, 1).subscribe({
      next: () => {
        this.ordersItemsSignal.update(map => {
          const newMap = new Map(map);
          const tableData = newMap.get(table.id);
          if (tableData) {
            const existingItem = tableData.items.find(i => i.id === productId);

            if (existingItem && existingItem.quantity > 1) {
              tableData.items = tableData.items.map(i =>
                i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
              );
            } else {
              tableData.items = tableData.items.filter(item => item.id !== productId);
            }

            newMap.set(table.id, tableData);
            this.save(newMap);
          }
          return newMap;
        });
      },
      error: () => this.ui.handleError('Error al devolver el producto al stock')
    });
  }
}
