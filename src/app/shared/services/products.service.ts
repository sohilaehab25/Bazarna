import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ApiResponse, Category, FeaturedInfo, Product } from '../../../app.type';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3009/api';

  private products = signal<Product[]>([]);
  private categories = signal<Category[]>([]);
  private featuredInfo = signal<FeaturedInfo[]>([
    {
      icon: '🏆',
      title: 'Quality Guaranteed',
      description: 'Every product is carefully inspected for the highest quality standards',
      link: '/products',
      linkText: 'Browse Products'
    },
    {
      icon: '🚚',
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50 with fast and secure delivery',
      link: '/products',
      linkText: 'Start Shopping'
    },
    {
      icon: '💬',
      title: '24/7 Support',
      description: 'Our friendly team is here to help with any questions you have',
      link: '/contact',
      linkText: 'Contact Us'
    }
  ]);
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

  getFeaturedInfo() {
    return this.featuredInfo;
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