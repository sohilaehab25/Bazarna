import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent, ButtonComponent } from '../../shared/components';
import { ProductsService } from '../../shared/services';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="product-detail" *ngIf="product">
      <div class="product-detail__content">
        <div class="product-detail__image">
          <div class="product-emoji">{{ product.emoji }}</div>
        </div>
        <div class="product-detail__info">
          <h1>{{ product.name }}</h1>
          <p class="product-category">{{ product.category }}</p>
          <p class="product-price">{{ product.price | currency }}</p>
          <p class="product-description">{{ product.description }}</p>
          <div class="product-actions">
            <app-button (onClick)="addToCart()">
              Add to Cart 🛒
            </app-button>
            <app-button variant="secondary" routerLink="/products">
              Back to Products
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent {
  private productsService = inject(ProductsService);

  // In real app, get product ID from route params
  product = this.productsService.getProductById('1'); // Mock for first product

  addToCart() {
    if (this.product) {
      // TODO: Implement add to cart
      alert('Added to cart! 🛒');
    }
  }
}