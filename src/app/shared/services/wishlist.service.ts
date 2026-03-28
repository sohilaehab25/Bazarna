import { Injectable, signal } from '@angular/core';

export interface WishlistItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
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

  addToWishlist(item: WishlistItem) {
    const currentWishlist = this.wishlist();
    if (!currentWishlist.find(w => w.id === item.id)) {
      this.wishlist.set([...currentWishlist, { ...item, addedAt: new Date() }]);
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