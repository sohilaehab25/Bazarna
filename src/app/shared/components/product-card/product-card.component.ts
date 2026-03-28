import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { ProductsService } from '../../services/products.service';
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
  product = input.required<any>();

  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);

  isInWishlist = () => this.wishlistService.isInWishlist(this.product().id);

  // Output events
  onViewDetails = output<any>();

  addToCart() {
    this.cartService.addToCart(this.product());
  }

  viewDetails() {
    this.onViewDetails.emit(this.product());
  }

  toggleWishlist() {
    if (this.isInWishlist()) {
      this.wishlistService.removeFromWishlist(this.product().id);
    } else {
      this.wishlistService.addToWishlist(this.product());
    }
  }
}