import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <aside class="product-filters">
      <app-card>
        <div class="filter-section">
          <h3>📂 Categories</h3>
          <div class="filter-options">
            <label class="filter-option" *ngFor="let category of categories">
              <input type="checkbox" [value]="category.id" class="filter-checkbox">
              <span class="filter-label">{{ category.name }}</span>
              <span class="filter-count">({{ category.count }})</span>
            </label>
          </div>
        </div>
      </app-card>

      <app-card>
        <div class="filter-section">
          <h3>💰 Price Range</h3>
          <div class="price-inputs">
            <input type="number" placeholder="Min" class="price-input">
            <span class="price-separator">-</span>
            <input type="number" placeholder="Max" class="price-input">
          </div>
          <app-button variant="secondary" size="small" class="apply-filter">
            Apply
          </app-button>
        </div>
      </app-card>

      <app-card>
        <div class="filter-section">
          <h3>⭐ Rating</h3>
          <div class="filter-options">
            <label class="filter-option" *ngFor="let rating of ratings">
              <input type="checkbox" [value]="rating.value" class="filter-checkbox">
              <span class="filter-stars">{{ rating.stars }}</span>
              <span class="filter-label">& up</span>
            </label>
          </div>
        </div>
      </app-card>

      <app-card>
        <div class="filter-section">
          <h3>🏷️ Tags</h3>
          <div class="tags-list">
            <span class="tag" *ngFor="let tag of tags">{{ tag }}</span>
          </div>
        </div>
      </app-card>

      <div class="filter-actions">
        <app-button variant="secondary" (onClick)="clearFilters()">
          Clear All Filters
        </app-button>
      </div>
    </aside>
  `,
  styleUrls: ['./product-filters.component.scss']
})
export class ProductFiltersComponent {
  categories = [
    { id: 'accessories', name: 'Accessories', count: 25 },
    { id: 'home', name: 'Home & Decor', count: 40 },
    { id: 'kitchen', name: 'Kitchen', count: 18 },
    { id: 'jewelry', name: 'Jewelry', count: 32 },
    { id: 'clothing', name: 'Clothing', count: 15 }
  ];

  ratings = [
    { value: 4, stars: '⭐⭐⭐⭐', label: '& up' },
    { value: 3, stars: '⭐⭐⭐', label: '& up' },
    { value: 2, stars: '⭐⭐', label: '& up' },
    { value: 1, stars: '⭐', label: '& up' }
  ];

  tags = ['Handmade', 'Eco-friendly', 'Vintage', 'Unique', 'Gift', 'Artisan'];

  clearFilters() {
    // Reset all filters
    console.log('Filters cleared');
  }
}