import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Product, ProductsService } from './products.service';
import { AuthService } from './auth.service';
import { SocketService } from './socket.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendCartItem {
  productId: Product;
  quantity: number;
}

interface BackendCart {
  items: BackendCartItem[];
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private productsService = inject(ProductsService);
  private apiUrl = 'http://localhost:3009/api/cart';

  private cartItems = signal<CartItem[]>([]);
  
  cartItemsCount = computed(() => this.cartItems().reduce((total, item) => total + item.quantity, 0));
  cartTotal = computed(() => Math.round(this.cartItems().reduce((total, item) => total + (item.product.price * item.quantity), 0)));

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCart();
      this.initStockUpdates();
    }
  }

  private initStockUpdates() {
    this.socketService.onEvent('product-stock-updated').subscribe((data: { productId: string, newStock: number }) => {
      this.productsService.updateStock(data.productId, data.newStock);
      
      // Also update stock in cart items if present
      this.cartItems.update(items => items.map(item => {
        if (item.product._id === data.productId) {
          return { ...item, product: { ...item.product, stock: data.newStock } };
        }
        return item;
      }));
    });
  }

  loadCart() {
    this.http.get<ApiResponse<BackendCart>>(this.apiUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const items = res.data.items.map(item => ({
            product: item.productId,
            quantity: item.quantity
          }));
          this.cartItems.set(items);
        }
      }
    });
  }

  addToCart(product: Product, quantity: number = 1) {
    const existingItem = this.cartItems().find(item => item.product._id === product._id);
    
    if (existingItem) {
      this.updateQuantity(product._id, existingItem.quantity + quantity);
    } else {
      // Optimistic update
      this.cartItems.set([...this.cartItems(), { product, quantity }]);
      
      this.http.post<ApiResponse<BackendCart>>(`${this.apiUrl}/add`, {
        productId: product._id,
        quantity
      }).subscribe({
        next: (res) => {
          if (res.success) {
            console.log('Successfully added to cart:', product.name);
            this.syncCart(res.data);
          }
        },
        error: (err) => {
          console.error('Failed to add to cart:', err);
          this.loadCart();
        }
      });
    }
  }

  increase(productId: string) {
    const item = this.cartItems().find(i => i.product._id === productId);
    if (item && item.quantity < item.product.stock) {
      this.updateQuantity(productId, item.quantity + 1);
    }
  }

  decrease(productId: string) {
    const item = this.cartItems().find(i => i.product._id === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity - 1);
    }
  }

  updateQuantity(productId: string, quantity: number) {
    // if (!this.authService.isLoggedIn()) return;

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const item = this.cartItems().find(i => i.product._id === productId);
    if (item && quantity > item.product.stock) {
      return; // Cannot exceed stock
    }

    // Optimistic update
    this.cartItems.update(items => items.map(i => 
      i.product._id === productId ? { ...i, quantity } : i
    ));

    this.http.post<ApiResponse<BackendCart>>(`${this.apiUrl}/update-quantity`, {
      productId,
      quantity
    }).subscribe({
      next: (res) => {
        if (res.success) this.syncCart(res.data);
      },
      error: () => this.loadCart()
    });
  }

  removeFromCart(productId: string) {
    if (!this.authService.isLoggedIn()) return;

    // Optimistic update
    this.cartItems.update(items => items.filter(i => i.product._id !== productId));

    this.http.delete<ApiResponse<BackendCart>>(`${this.apiUrl}/remove/${productId}`).subscribe({
      next: (res) => {
        if (res.success) this.syncCart(res.data);
      },
      error: () => this.loadCart()
    });
  }

  clearCart() {
    this.cartItems.set([]);
  }

  private syncCart(data: BackendCart) {
    const items = data.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));
    this.cartItems.set(items);
  }

  getCartItems() {
    return this.cartItems;
  }
}