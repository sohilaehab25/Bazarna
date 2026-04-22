import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ProductsService } from '../../shared/services/products.service';
import { WishlistService } from '../../shared/services/wishlist.service';
import { CartService } from '../../shared/services/cart.service';
import { Product } from '../../shared/services/products.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, ModalComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent {
  private productsService = inject(ProductsService);
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  allProducts = this.productsService.getProducts();
  isModalOpen = signal(false);
  selectedProduct = signal<Product | null>(null);

  // Get category from query params
  category = computed(() => this.route.snapshot.queryParams['category']);

  // Filter products based on category
  products = computed(() => {
    const cat = this.category();
    if (cat) {
      return this.allProducts().filter(p => p.categoryId.name === cat);
    }
    return this.allProducts();
  });

  // Get page title based on category
  pageTitle = computed(() => {
    const cat = this.category();
    return cat ? `${cat} Products` : 'All Products';
  });

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