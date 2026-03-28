import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { WishlistService, WishlistItem } from '../../shared/services/wishlist.service';
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

  // Group items by category
  groupedItems = computed(() => {
    const items = this.wishlistItems();
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, WishlistItem[]>);
    return grouped;
  });

  // Get category keys for iteration
  categories = computed(() => Object.keys(this.groupedItems()));

  trackById(index: number, item: any): string {
    return item.id;
  }

  addToCart(item: any) {
    this.cartService.addToCart(item);
  }

  removeFromWishlist(itemId: string) {
    this.wishlistService.removeFromWishlist(itemId);
  }

  getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'Accessories': '🧣',
      'Home': '🏠',
      'Decor': '💍',
      'Groceries': '🥕',
      'Cheese': '🧀',
      'Sauces': '🍯',
      'Kitchen': '☕',
      'Jewelry': '💍',
      'Art': '🎨'
    };
    return emojiMap[category] || '📦';
  }
}