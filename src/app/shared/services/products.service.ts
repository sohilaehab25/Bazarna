import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: {
    _id: string;
    name: string;
    description: string;
  };
  imageUrl: string;
  stock: number;
  rating?: number;
  reviews?: number;
}

interface Category {
  _id: string;
  name: string;
  description: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3009/api';

  private products = signal<Product[]>([]);
  private categories = signal<Category[]>([]);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProducts();
      this.loadCategories();
    }
  }

  private loadProducts() {
    this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/products`).subscribe({
      next: (res) => {
        if (res.success) {
          this.products.set(res.data);
        }
      }
    });
  }

  private loadCategories() {
    this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data);
        }
      }
    });
  }

  getProducts() {
    return this.products;
  }

  getCategories() {
    return computed(() => this.categories().map(c => c.name));
  }

  getProductsByCategory(categoryName: string) {
    return computed(() => this.products().filter(p => p.categoryId.name === categoryName));
  }

  getProductById(id: string) {
    return this.products().find(p => p._id === id);
  }

  updateStock(productId: string, newStock: number) {
    this.products.update(products => 
      products.map(p => p._id === productId ? { ...p, stock: newStock } : p)
    );
  }
}