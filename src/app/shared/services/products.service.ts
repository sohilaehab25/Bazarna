import { Injectable, signal } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
  image: string;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  isNew?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private products = signal<Product[]>([
    {
      id: '1',
      name: 'Handmade Scarf',
      description: 'Soft wool scarf with floral patterns',
      price: 25.99,
      category: 'Accessories',
      emoji: '🧣',
      image: 'https://images.unsplash.com/photo-1601762603332-fd61e28b698a?w=400',
      originalPrice: 35.99,
      rating: 4.5,
      reviews: 23
    },
    {
      id: '2',
      name: 'Ceramic Mug',
      description: 'Cozy mug perfect for your morning coffee',
      price: 12.50,
      category: 'Home',
      emoji: '☕',
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400',
      rating: 4.2,
      reviews: 45
    },
    {
      id: '3',
      name: 'Vintage Jewelry Box',
      description: 'Elegant wooden box for your treasures',
      price: 45.00,
      category: 'Decor',
      emoji: '💍',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
      originalPrice: 60.00,
      rating: 4.8,
      reviews: 12
    }
  ]);

  getProducts() {
    return this.products;
  }

  getProductById(id: string) {
    return this.products().find(p => p.id === id);
  }

  getProductsByCategory(category: string) {
    return this.products().filter(p => p.category === category);
  }
}