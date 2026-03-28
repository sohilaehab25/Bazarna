import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { WishlistService } from '../../shared/services/wishlist.service';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent {
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);

  wishlistItems = this.wishlistService.getWishlist();

  trackById(index: number, item: any): string {
    return item.id;
  }

  addToCart(item: any) {
    this.cartService.addToCart(item);
  }

  removeFromWishlist(itemId: string) {
    this.wishlistService.removeFromWishlist(itemId);
  }
}