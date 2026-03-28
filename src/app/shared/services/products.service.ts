import { Injectable, signal, computed } from '@angular/core';

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
    // Handmade/Artisan Products
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
    },
    // Groceries
    {
      id: '4',
      name: 'Organic Bananas',
      description: 'Fresh organic bananas, perfect for smoothies',
      price: 2.99,
      category: 'Groceries',
      emoji: '🍌',
      image: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=400',
      rating: 4.7,
      reviews: 89
    },
    {
      id: '5',
      name: 'Whole Milk',
      description: 'Fresh whole milk from local dairy farms',
      price: 3.49,
      category: 'Groceries',
      emoji: '🥛',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      rating: 4.3,
      reviews: 156
    },
    {
      id: '6',
      name: 'Free-Range Eggs',
      description: 'Farm fresh eggs from free-range chickens',
      price: 5.99,
      category: 'Groceries',
      emoji: '🥚',
      image: 'https://images.unsplash.com/photo-1582722872445-70da27f7d7e6?w=400',
      rating: 4.6,
      reviews: 78
    },
    // Cheese
    {
      id: '7',
      name: 'Aged Cheddar Cheese',
      description: 'Sharp and creamy aged cheddar from Wisconsin',
      price: 8.99,
      category: 'Cheese',
      emoji: '🧀',
      image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400',
      rating: 4.8,
      reviews: 67
    },
    {
      id: '8',
      name: 'Fresh Mozzarella',
      description: 'Soft and fresh mozzarella balls in water',
      price: 6.49,
      category: 'Cheese',
      emoji: '🧀',
      image: 'https://images.unsplash.com/photo-1551782450-17144efb5723?w=400',
      rating: 4.4,
      reviews: 92
    },
    {
      id: '9',
      name: 'Goat Cheese Log',
      description: 'Creamy goat cheese log with herbs',
      price: 7.99,
      category: 'Cheese',
      emoji: '🧀',
      image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400',
      rating: 4.5,
      reviews: 43
    },
    // Sauces
    {
      id: '10',
      name: 'Marinara Sauce',
      description: 'Authentic Italian marinara sauce made with fresh tomatoes',
      price: 4.99,
      category: 'Sauces',
      emoji: '🍅',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
      rating: 4.6,
      reviews: 134
    },
    {
      id: '11',
      name: 'Sriracha Hot Sauce',
      description: 'Spicy and tangy hot sauce perfect for Asian cuisine',
      price: 3.99,
      category: 'Sauces',
      emoji: '🌶️',
      image: 'https://images.unsplash.com/photo-1589378341525-662dd2b8106f?w=400',
      rating: 4.7,
      reviews: 203
    },
    {
      id: '12',
      name: 'Pesto Sauce',
      description: 'Fresh basil pesto made with extra virgin olive oil',
      price: 7.49,
      category: 'Sauces',
      emoji: '🌿',
      image: 'https://images.unsplash.com/photo-1551782450-17144efb5723?w=400',
      rating: 4.3,
      reviews: 87
    },
    // More Handmade Products
    {
      id: '13',
      name: 'Handcrafted Leather Wallet',
      description: 'Genuine leather wallet with multiple card slots',
      price: 39.99,
      category: 'Accessories',
      emoji: '👛',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      originalPrice: 49.99,
      rating: 4.9,
      reviews: 34
    },
    {
      id: '14',
      name: 'Artisan Bread Loaf',
      description: 'Freshly baked sourdough bread from local bakery',
      price: 6.99,
      category: 'Groceries',
      emoji: '🍞',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      rating: 4.8,
      reviews: 156
    },
    {
      id: '15',
      name: 'Blue Cheese Wedge',
      description: 'Creamy blue cheese with distinctive flavor',
      price: 9.99,
      category: 'Cheese',
      emoji: '🧀',
      image: 'https://images.unsplash.com/photo-1551782450-17144efb5723?w=400',
      rating: 4.2,
      reviews: 28
    }
  ]);

  getProducts() {
    return this.products;
  }

  getCategories() {
    const categories = [...new Set(this.products().map(p => p.category))];
    return signal(categories);
  }

  getProductsByCategory(category: string) {
    return computed(() => this.products().filter(p => p.category === category));
  }

  getProductById(id: string) {
    return this.products().find(p => p.id === id);
  }
}