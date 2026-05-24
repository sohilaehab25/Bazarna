import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product, WishlistItem } from '../../../app.type';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'wishlistItems';
  private wishlist = signal<WishlistItem[]>(this.loadFromStorage());

  private loadFromStorage(): WishlistItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as WishlistItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private persistWishlist(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.wishlist()));
  }

  getWishlist() {
    return this.wishlist;
  }

  addToWishlist(item: Product) {
    const currentWishlist = this.wishlist();
    if (!currentWishlist.find(w => w._id === item._id)) {
      const wishlistItem: WishlistItem = { ...item, addedAt: new Date() };
      this.wishlist.set([...currentWishlist, wishlistItem]);
      this.persistWishlist();
    }
  }

  removeFromWishlist(itemId: string) {
    this.wishlist.set(this.wishlist().filter(item => item._id !== itemId));
    this.persistWishlist();
  }

  isInWishlist(itemId: string): boolean {
    return this.wishlist().some(item => item._id === itemId);
  }

  clearWishlist() {
    this.wishlist.set([]);
    this.persistWishlist();
  }
}