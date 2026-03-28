import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ModalComponent } from '../modal/modal.component';
import { Product } from '../../services/products.service';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, ModalComponent],
  templateUrl: './product-showcase.component.html',
  styleUrl: './product-showcase.component.scss'
})
export class ProductShowcaseComponent {
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);

  title = input.required<string>();
  subtitle = input<string>('');
  products = input.required<Product[]>();

  isModalOpen = signal(false);
  selectedProduct = signal<Product | null>(null);

  openModal(product: Product): void {
    this.selectedProduct.set(product);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedProduct.set(null);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  addToWishlist(product: Product): void {
    this.wishlistService.addToWishlist(product);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }
}