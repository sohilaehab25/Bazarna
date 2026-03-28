import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-sort-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="sort-dropdown">
      <div class="sort-label">
        <span class="sort-icon">🔀</span>
        <span>Sort by:</span>
      </div>
      <select class="sort-select" (change)="onSortChange($event)">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="rating">Highest Rated</option>
        <option value="popular">Most Popular</option>
        <option value="name">Name A-Z</option>
      </select>
      <div class="sort-info">
        <span class="sort-count">{{ totalItems }} products</span>
        <span class="sort-current">{{ currentSort }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./sort-dropdown.component.scss']
})
export class SortDropdownComponent {
  currentSort = 'Newest First';
  totalItems = 125;

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.currentSort = target.options[target.selectedIndex].text;
    // In real app, emit event to parent component
    console.log('Sort changed to:', target.value);
  }
}