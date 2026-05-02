import {Component, computed, inject, Input, OnInit, signal} from '@angular/core';
import {ProductService} from '../../../../services/product-service';
import {CategoryService} from '../../../../services/category-service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Allergen} from '../../../../common/interfaces/interfaces';
import {CurrencyPipe} from '@angular/common';
import {environment} from '../../../../environment/environment';
import {FormValidators} from '../../../../Validators/FormValidators';
import {UiService} from '../../../../services/ui-service';

@Component({
  selector: 'app-products-edit',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './products-edit.html',
  styleUrl: './products-edit.css',
})
export class ProductsEdit implements OnInit {
  @Input('id') idProduct?: number;

  private imageVersion = new Date().getTime();

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
    if (!imageName || imageName === 'placeholder.jpg') {
      return 'assets/images/placeholder.jpg';
    }

    // Ahora la ruta es /assets/images/...
    return `${environment.imagesUrl}${imageName}?t=${this.imageVersion}`;
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
      description: ['', [Validators.minLength(4), Validators.maxLength(450)]],
      image: ['placeholder.jpg'], // Valor por defecto
      price: [0, [Validators.required, FormValidators.minValue(0)]],
      category_id: ['', [Validators.required]],
      stock: [0, [Validators.required, FormValidators.minValue(0)]],
      vegan: [false],
      vegetarian: [false],
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
          this.formProduct.patchValue(prod);
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
    if (this.formProduct.invalid) return this.formProduct.markAllAsTouched();
    this.productService.saveProduct(
      this.idProduct,
      this.formProduct.getRawValue(),
      this.selectedFile,
      this.selectedAllergenIds()
    ).subscribe({
      next: () => {
        if (this.selectedFile) {
          this.imageVersion = new Date().getTime();
        }
        this.ui.notify(this.idProduct ? "Producto actualizado" : "Producto creado");
        this.router.navigateByUrl('/menu');
      },
      error: (err) => this.ui.handleError("Error al guardar", err)
    });
  }
}
