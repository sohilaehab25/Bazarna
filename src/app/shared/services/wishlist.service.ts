import { Injectable, signal } from '@angular/core';
import { Product } from './products.service';

export interface WishlistItem extends Product {
  addedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlist = signal<WishlistItem[]>([]);

  getWishlist() {
    return this.wishlist;
  }

  addToWishlist(item: Product) {
    const currentWishlist = this.wishlist();
    if (!currentWishlist.find(w => w.id === item.id)) {
      const wishlistItem: WishlistItem = { ...item, addedAt: new Date() };
      this.wishlist.set([...currentWishlist, wishlistItem]);
    }
  }

  removeFromWishlist(itemId: string) {
    this.wishlist.set(this.wishlist().filter(item => item.id !== itemId));
  }

  isInWishlist(itemId: string): boolean {
    return this.wishlist().some(item => item.id === itemId);
  }

  clearWishlist() {
    this.wishlist.set([]);
  }
}