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
  public updateDuplicates = signal(false);

  public imageVersion = new Date().getTime().toString();
  @ViewChild('closeModal') closeModal!: ElementRef;

  public pendingAction: 'delete' | 'duplicate' | null = null;
  public selectedProductId: number | null = null;

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
    this.selectedCategory();
    this.viewArchived();
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
    this.route.queryParams.subscribe(params => {
      this.imageVersion = new Date().getTime().toString();

      const tableId = params['table_id'];
      const tableName = params['tableName'];

      if (tableId) {
        const mesaActual = this.orderService.activeTable();
        if (!mesaActual || mesaActual.id !== String(tableId)) {
          this.orderService.setActiveTable(String(tableId), tableName);
        }
      }
      this.currentTableId = tableId;
      this.currentTableName = tableName;
      if (params['refresh'] || params['t']) {
        this.loadProducts();
      }
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
        this.ui.notify(`Producto ${modo} con éxito`);
        this.loadProducts()
      },
      error: () => this.ui.handleError('Error al cambiar el estado')
    });
  }

  deleteProduct(id: number) {
    this.selectedProductId = id;
    this.pendingAction = 'delete';
    this.showModal('actionConfirmModal');
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
    const base = environment.apiUrl;
    const imageStr = String(imageName).trim();

    if (!imageName || ['null', 'None', ''].includes(imageStr) || imageStr.includes('placeholder')) return 'assets/images/placeholder.jpg';
    if (imageStr.startsWith('assets/images/')) return `${base}${imageStr}?t=${this.imageVersion}`;

    return `${base}assets/images/${imageStr}?t=${this.imageVersion}`;
  }

  exportProducts() {
    this.productService.exportProducts().subscribe({
      next: (blob) => this.fileService.downloadBlob(blob, 'productos.xlsx'),
      error: () => this.ui.handleError('Error al exportar')
    });
  }

  onFileSelectedForImport(event: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();

    formData.append("file", file);
    // Pasamos el valor como string "true" o "false" para FastAPI
    formData.append("update_duplicates", this.updateDuplicates() ? "true" : "false");

    this.productService.importProducts(formData).subscribe({
      next: () => {
        this.ui.notify("Importación exitosa");
        this.loadProducts();
        // Reseteamos el valor del input para permitir reintentos
        input.value = '';
        if (this.closeModal?.nativeElement) {
          this.closeModal.nativeElement.click();
        }
      },
      error: (err) => {
        console.error(err);
        this.ui.handleError("Error en la importación. Revisa el formato del archivo.");
      }
    });
  }

  downloadTemplate() {
    const headers = 'name,price,category_name,stock,vegan,vegetarian,lactose_free,allergens_names,description';
    const allergensExample = '"[\'🥚Huevos\', \'🥛Lácteos\', \'🌾Gluten\', \'🥜Frutos secos\']"';
    const exampleRow = '\nProducto Ejemplo,12.50,Entrantes,10,0,1,0,' + allergensExample + ',Descripción deliciosa';

    const blob = new Blob([headers + exampleRow], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'plantilla_productos.csv';
    link.click();
  }

  duplicateProduct(id: number) {
    this.selectedProductId = id;
    this.pendingAction = 'duplicate';
    this.showModal('actionConfirmModal');
  }


  public agregarAlPedido(producto: Product): void {
    const prodEnStock = this.allProducts().find(p => String(p.id) === String(producto.id));

    if (!prodEnStock || prodEnStock.stock <= 0) {
      this.ui.notify(`Lo sentimos, no queda stock de ${producto.name}`);
      return;
    }
    this.orderService.addItemToOrder(producto);
  }

  executeAction() {
    if (!this.selectedProductId) return;

    if (this.pendingAction === 'delete') {
      this.productService.deleteProduct(this.selectedProductId).subscribe({
        next: () => {
          this.ui.notify('Producto eliminado');
          this.loadProducts();
        },
        error: (err) => this.ui.handleError('Error al eliminar', err)
      });
    } else if (this.pendingAction === 'duplicate') {
      this.productService.duplicate(this.selectedProductId).subscribe({
        next: () => {
          this.ui.notify('Producto duplicado');
          this.loadProducts();
        },
        error: (err) => this.ui.handleError('Error al duplicar:', err)
      });
    }
  }

  private showModal(id: string) {
    const modalElement = document.getElementById(id);
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }
}
