import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { Product } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  product = input.required<Product>();

  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);

  isInWishlist = computed(() => this.wishlistService.isInWishlist(this.product()._id));
  
  cartQuantity = computed(() => {
    const item = this.cartService.getCartItems()().find(i => i.product._id === this.product()._id);
    return item ? item.quantity : 0;
  });

  // Output events
  onViewDetails = output<Product>();

  addToCart() {
    this.cartService.addToCart(this.product());
  }

  incrementQuantity() {
    this.cartService.updateQuantity(this.product()._id, this.cartQuantity() + 1);
  }

  decrementQuantity() {
    this.cartService.updateQuantity(this.product()._id, this.cartQuantity() - 1);
  }

  viewDetails() {
    this.onViewDetails.emit(this.product());
  }

  toggleWishlist() {
    if (this.isInWishlist()) {
      this.wishlistService.removeFromWishlist(this.product()._id);
    } else {
      this.wishlistService.addToWishlist(this.product());
    }
  }
}