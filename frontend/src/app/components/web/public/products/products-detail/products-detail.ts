import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../../../common/interfaces/interfaces';
import { ProductService } from '../../../../../services/product-service';

@Component({
  selector: 'app-products-detail',
  imports: [
    CurrencyPipe,
  ],
  templateUrl: './products-detail.html',
  styleUrl: './products-detail.css',
})
export class ProductsDetail implements OnInit {
  @Input('id') idProduct?: number;

  private readonly productService = inject(ProductService);

  product = signal<Product | null>(null);
  loaded = signal<boolean>(false);

  ngOnInit() {
    if (this.idProduct) {
      this.productService.getProductById(this.idProduct).subscribe({
        next: (p) => {
          this.product.set(p);
          this.loaded.set(true);
        },
        error: (err) => {
          console.error('Error en la petición:', err);
         this.loaded.set(true);
        }
      });
    }
  }

  getProductImage(imageName: any): string {
    const basePath = 'assets/images/';
    if (!imageName || ['null', 'None', ''].includes(String(imageName).trim())) {
      return basePath + 'placeholder.jpg';
    }
    return basePath + imageName;
  }

  hasDiet(): boolean {
    const p = this.product();
    return !!(p?.vegan || p?.vegetarian || p?.lactose_free);
  }
}
