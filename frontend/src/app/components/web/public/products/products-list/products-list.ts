import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../services/auth-service';
import {Product, Category, Allergen} from '../../../../../common/interfaces/interfaces';
import { ProductService } from '../../../../../services/product-service';
import { CategoryService } from '../../../../../services/category-service';
import { environment } from '../../../../../environment/environment';
import { FileService } from '../../../../../services/file-service';
import {Sidebar} from '../../../../structure/sidebar/sidebar';
import {UiService} from '../../../../../services/ui-service';
import {OrderService} from '../../../../../services/order-service';
import {OrderSummary} from '../../../authenticated/orders/order-summary/order-summary';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Sidebar, OrderSummary,],
  templateUrl: './products-list.html',
  styleUrl: './products-list.css',
})
export class ProductsList implements OnInit {
  public readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fileService = inject(FileService);
  public readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);
  private route = inject(ActivatedRoute);
  protected orderService = inject(OrderService);

  private imageVersion = '1';

  @ViewChild('closeModal') closeModal!: ElementRef;

  public allProducts = computed(() => this.productService.products());
  categories = signal<Category[]>([]);
  allergens = signal<Allergen[]>([]);

  selectedAllergens = signal<number[]>([]);
  viewArchived = signal(false);
  search = signal('');
  selectedCategory = signal<number | null>(null);
  SelectedMaxPrice = signal(100);

  absoluteMaxPrice = computed(() => {
    const prods = this.allProducts();
    if (prods.length === 0) return 100;
    return Math.ceil(Math.max(...prods.map(p => p.price)));
  });

  vegan = signal(false);
  vegetarian = signal(false);

  showSummary = toSignal(
    this.route.queryParamMap.pipe(
      map(params => params.has('table_id'))
    ),
    { initialValue: false }
  );

  public currentTableId: string | null = null;
  public currentTableName: string | null = null;

  private readonly filterWatcher = effect(() => {
    const cat = this.selectedCategory();
    const arch = this.viewArchived();
    this.loadProducts();
  });

  ngOnInit() {
    this.categoryService.load().subscribe({
      next: (data) => {
        this.categories.set(data)
        this.loadAllergens();
      },
      error: (err) => this.ui.handleError('Error cargando categorías: ', err)
    });
    this.loadProducts();
    // ESTO ES LO QUE DEBES CORREGIR
    this.route.queryParams.subscribe(params => {
      const tableId = params['table_id'];
      const tableName = params['tableName'];

      if (tableId) {
        const mesaActual = this.orderService.activeTable();

        // CORRECCIÓN: Comparamos cuidadosamente.
        // Si no hay mesa o el ID es distinto, seteamos.
        // Si la mesa es la misma, NO llamamos a setActiveTable para no borrar los 'data' (reserva).
        if (!mesaActual || mesaActual.id !== String(tableId)) {
          this.orderService.setActiveTable(String(tableId), tableName);
        }
      }

      // Sincronizamos las variables locales por si se usan en el HTML
      this.currentTableId = tableId;
      this.currentTableName = tableName;
    });
    this.currentTableId = this.route.snapshot.queryParamMap.get('tableId');
    this.currentTableName = this.route.snapshot.queryParamMap.get('tableName');
  }

  private loadProducts() {
    const isArchived = this.viewArchived() ? 1 : 0;

    this.productService.getProducts(this.selectedCategory() || undefined, isArchived).subscribe({
      next: (prods) => {
        if (this.search() === '') {
          this.updatePriceRange(prods);
        }
      }
    });
  }

  loadAllergens() {
    this.productService.getAllergens().subscribe(data => this.allergens.set(data));
  }

  filteredProducts = computed(() => {
    return this.allProducts()
      .filter(p => this.applyFilters(p))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  groupedProducts = computed(() => {
    const groups = this.filteredProducts().reduce((acc, p) => {
      const catName = p.category_name || this.getCategoryName(p.category_id);
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    return Object.entries(groups)
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  });

  private applyFilters(p: Product): boolean {
    const matchSearch = p.name.toLowerCase().includes(this.search().toLowerCase());
    const selectedCat = this.selectedCategory();
    const matchCat = !selectedCat || Number(p.category_id) === Number(selectedCat);
    const matchPrice = p.price <= this.SelectedMaxPrice();

    const matchDiet = (!this.vegan() || p.vegan === 1) &&
      (!this.vegetarian() || p.vegetarian === 1);
    const selectedAlgs = this.selectedAllergens();
    const hasForbiddenAllergen = p.allergens?.some(a => selectedAlgs.includes(a.id));
    const matchAllergens = selectedAlgs.length === 0 || !hasForbiddenAllergen;

    return matchSearch && matchCat && matchPrice && matchDiet && matchAllergens;
  }

  private updatePriceRange(prods: Product[]) {
    if (prods.length === 0) return;
    const max = Math.ceil(Math.max(...prods.map(p => p.price)));
    this.SelectedMaxPrice.set(max);
  }

  private getCategoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name || 'Otros';
  }

  onToggleArchive(id: number) {
    this.productService.toggleArchive(id).subscribe({
      next: (res) => {
        const modo = res.new_archived_status === 1 ? 'archivado' : 'restaurado';
        this.ui.handleError(`Producto ${modo} con éxito`);
        this.loadProducts()
      },
      error: () => this.ui.handleError('Error al cambiar el estado')
    });
  }

  deleteProduct(id: number) {
    if (!confirm("¿Eliminar producto definitivamente?")) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.ui.notify('Producto eliminado');
        this.loadProducts(); // Refresca la señal del servicio
      },
      error: (err) => this.ui.handleError('Error al eliminar', err)
    });
  }

  resetFilters() {
    this.search.set('');
    this.vegan.set(false);
    this.vegetarian.set(false);
    this.selectedCategory.set(null);
    this.selectedAllergens.set([])
    this.loadProducts();
  }

  getProductImage(imageName: any): string {
  // Asegúrate de que apiUrl sea 'http://localhost:8000/'
  const base = environment.apiUrl;

  if (!imageName || ['null', 'None', '', 'placeholder.jpg'].includes(String(imageName).trim())) {
    return 'assets/images/placeholder.jpg';
  }

  // Si base ya termina en '/', no pongas otra barra
  return `${base}assets/images/${imageName}?t=${this.imageVersion}`;
}

  exportProducts() {
    this.productService.exportProducts().subscribe({
      next: (blob) => this.fileService.downloadBlob(blob, 'productos.xlsx'),
      error: () => this.ui.handleError('Error al exportar')
    });
  }

  onFileSelectedForImport(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    this.productService.importProducts(formData).subscribe({
      next: () => {
        alert("✅ Importación exitosa");
        this.loadProducts();
        this.closeModal.nativeElement.click();
      },
      error: () => this.ui.handleError("Error en el formato del archivo")
    });
  }

  downloadTemplate() {
    const headers = 'name,price,category_name,stock,vegan,vegetarian,image';
    const blob = new Blob([headers], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'plantilla_productos.csv';
    link.click();
  }

  duplicateProduct(id: number) {
    this.ui.confirm('¿Estás seguro de que deseas duplicar este producto?').then((confirmed) => {
      if (confirmed) {
        this.productService.duplicate(id).subscribe({
          next: () => {
            this.loadProducts();
          },
          error: (err) => this.ui.handleError('Error al duplicar:', err)
        });
      }
    });
  }


  public agregarAlPedido(producto: Product): void {
    // Buscamos la versión más reciente del producto en la señal
    const prodEnStock = this.allProducts().find(p => String(p.id) === String(producto.id));

    if (!prodEnStock || prodEnStock.stock <= 0) {
      this.ui.notify(`Lo sentimos, no queda stock de ${producto.name}`);
      return;
    }

    // Enviamos al servicio de pedidos
    // Nota: El servicio de pedidos se encargará de llamar a productService.updateStock(id, -1)
    this.orderService.addItemToOrder(producto);
  }

}
