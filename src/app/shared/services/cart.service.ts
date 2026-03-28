import { Injectable, signal, computed } from '@angular/core';
import { Product } from './products.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = signal<CartItem[]>([]);

  cartItemsCount = computed(() => this.cartItems().reduce((total, item) => total + item.quantity, 0));
  cartTotal = computed(() => this.cartItems().reduce((total, item) => total + (item.product.price * item.quantity), 0));

  addToCart(product: Product, quantity: number = 1) {
    const currentItems = this.cartItems();
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      this.cartItems.set([...currentItems]);
    } else {
      this.cartItems.set([...currentItems, { product, quantity }]);
    }
  }

  removeFromCart(productId: string) {
    this.cartItems.set(this.cartItems().filter(item => item.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentItems = this.cartItems();
    const item = currentItems.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.cartItems.set([...currentItems]);
    }
  }

  clearCart() {
    this.cartItems.set([]);
  }

  getCartItems() {
    return this.cartItems;
  }
}