import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss']
})
export class ProductGridComponent {
  viewMode: 'grid' | 'list' = 'grid';
  itemsPerPage = 12;
  currentPage = 1;
  totalItems = 125;
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getEndItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // Mock products data
  products = [
    {
      id: '1',
      name: 'Handmade Scarf',
      description: 'Soft wool scarf with floral patterns',
      price: 25.99,
      emoji: '🧣'
    },
    {
      id: '2',
      name: 'Ceramic Mug',
      description: 'Cozy mug perfect for your morning coffee',
      price: 12.50,
      emoji: '☕'
    },
    {
      id: '3',
      name: 'Vintage Jewelry Box',
      description: 'Elegant wooden box for your treasures',
      price: 45.00,
      emoji: '💍'
    }
  ];

  trackById(index: number, item: any): string {
    return item.id;
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  onItemsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = parseInt(target.value, 10);
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  addToCart(product: any) {
    // TODO: Implement add to cart
    alert(`Added ${product.name} to cart!`);
  }
}