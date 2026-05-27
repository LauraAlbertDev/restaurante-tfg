import {Component, computed, inject, Input, OnInit, signal} from '@angular/core';
import {ProductService} from '../../../../services/product-service';
import {CategoryService} from '../../../../services/category-service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Allergen} from '../../../../common/interfaces/interfaces';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {environment} from '../../../../environment/environment';
import {FormValidators} from '../../../../Validators/FormValidators';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-products-edit',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './products-edit.html',
  styleUrl: './products-edit.css',
})
export class ProductsEdit implements OnInit {
  @Input('id') idProduct?: number;

  public imageVersion = new Date().getTime().toString();

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  loaded = signal(false);
  allAllergens = signal<Allergen[]>([]);
  selectedAllergenIds = signal<number[]>([]);
  imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;

  categories = this.categoryService.categories;

  imagePreviewUrl = computed(() => {
    if (this.imagePreview()) return this.imagePreview();

    const imageName = this.formProduct.get('image')?.value;
    const imageStr = String(imageName).trim();

    if (!imageName || ['null', 'None', ''].includes(imageStr) || imageStr.includes('placeholder')) {
      return 'assets/images/placeholder.jpg';
    }
    if (imageStr.startsWith('assets/images/')) {
      return `${environment.apiUrl}${imageStr}?t=${this.imageVersion}`;
    }
    return `${environment.apiUrl}assets/images/${imageStr}?t=${this.imageVersion}`;
  });

  selectedAllergenNames = computed(() => {
    const all = this.allAllergens();
    const selectedIds = this.selectedAllergenIds();

    return all
      .filter(a => selectedIds.includes(a.id))
      .map(a => a.name);
  });

  formProduct: FormGroup = this.initForm();

  get p() { return this.formProduct.controls; }

  private initForm() {
    return this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50), FormValidators.nonOnlyWhiteSpace]],
      description: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(450)]],
      image: ['placeholder.jpg'],
      price: [0, [Validators.required, FormValidators.minValue(0)]],
      category_id: [null, [Validators.required]],
      stock: [0, [Validators.required, FormValidators.minValue(0)]],
      vegan: [false],
      vegetarian: [false],
      updated_by: [null],
      updated_at: [null],
      editor_name: [null]
    });
  }

  ngOnInit() {
    this.initData();
  }

  private async initData() {
    this.categoryService.load().subscribe();
    this.productService.getAllergens().subscribe(data => this.allAllergens.set(data));

    if (this.idProduct) {
      this.productService.getProductById(this.idProduct).subscribe({
        next: (prod) => {
          console.log("Datos que vienen del backend:", prod);
          this.formProduct.patchValue(prod);
          this.formProduct.patchValue({
            updated_by: prod.updated_by  || 'Sistema',
            updated_at: prod.updated_at  || null
          });
          this.selectedAllergenIds.set(prod.allergens?.map(a => a.id) || []);
          this.loaded.set(true);
        },
        error: () => this.router.navigate(['/product/list'])
      });
    } else {
      this.loaded.set(true);
    }
  }


  toggleAllergen(id: number) {
    this.selectedAllergenIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.formProduct.patchValue({ image: file.name });
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onSubmit() {
    console.log("¿Formulario válido?:", this.formProduct.valid);
    if (this.formProduct.invalid) {
      Object.keys(this.formProduct.controls).forEach(key => {
        const controlErrors = this.formProduct.get(key)?.errors;
        if (controlErrors != null) {
          console.error(`Campo inválido -> ${key}:`, controlErrors);
        }
      });
      return this.formProduct.markAllAsTouched();
    }
    this.productService.saveProduct(
      this.idProduct,
      this.formProduct.getRawValue(),
      this.selectedFile,
      this.selectedAllergenIds()
    ).subscribe({
      next: (productoActualizado: any) => {
        this.imageVersion = new Date().getTime().toString();
        this.ui.notify(this.idProduct ? "Producto actualizado" : "Producto creado");

        if (this.productService.products && productoActualizado) {
          this.productService.products.update(prods => {
            const index = prods.findIndex(p => p.id === productoActualizado.id);
            if (index !== -1) {
              prods[index] = productoActualizado;
              return [...prods];
            } else {
              return [...prods, productoActualizado];
            }
          });
        }

        this.router.navigate(['/menu'], {
          queryParams: { refresh: 'true', t: new Date().getTime() },
          queryParamsHandling: 'merge'
        });
      },
      error: (err) => this.ui.handleError("Error al guardar", err)
    });
  }
}
