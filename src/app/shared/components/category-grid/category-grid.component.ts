import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  templateUrl: './category-grid.component.html',
  styleUrls: ['./category-grid.component.scss']
})
export class CategoryGridComponent {
  categories = [
    {
      id: 'accessories',
      name: 'Accessories',
      description: 'Scarves, hats, bags, and jewelry',
      icon: '🧣',
      itemCount: 45,
      rating: 4.8
    },
    {
      id: 'home',
      name: 'Home & Decor',
      description: 'Beautiful items for your home',
      icon: '🏠',
      itemCount: 67,
      rating: 4.9
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      description: 'Mugs, plates, and kitchenware',
      icon: '☕',
      itemCount: 32,
      rating: 4.7
    },
    {
      id: 'jewelry',
      name: 'Jewelry',
      description: 'Earrings, necklaces, and accessories',
      icon: '💍',
      itemCount: 58,
      rating: 4.9
    },
    {
      id: 'clothing',
      name: 'Clothing',
      description: 'Dresses, tops, and handmade garments',
      icon: '👗',
      itemCount: 29,
      rating: 4.6
    },
    {
      id: 'art',
      name: 'Art & Crafts',
      description: 'Paintings, prints, and handmade art',
      icon: '🎨',
      itemCount: 41,
      rating: 4.8
    }
  ];

  trackById(index: number, item: any): string {
    return item.id;
  }
}