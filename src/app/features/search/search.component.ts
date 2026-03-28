import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="search">
      <div class="search-bar">
        <input
          type="text"
          placeholder="Search for handmade treasures..."
          class="search-input"
          #searchInput>
        <app-button (onClick)="search(searchInput.value)">
          Search 🔍
        </app-button>
      </div>

      <div class="search-results" *ngIf="results.length > 0">
        <h2>Search Results</h2>
        <div class="results-grid">
          <app-card *ngFor="let product of results">
            <div class="search-result">
              <span class="result-emoji">{{ product.emoji }}</span>
              <h3>{{ product.name }}</h3>
              <p>{{ product.description }}</p>
              <p class="result-price">{{ product.price | currency }}</p>
              <app-button routerLink="/products">
                View Details
              </app-button>
            </div>
          </app-card>
        </div>
      </div>

      <div class="popular-searches" *ngIf="results.length === 0">
        <h2>Popular Searches</h2>
        <div class="search-tags">
          <app-button variant="secondary" (onClick)="searchTag('scarf')">
            🧣 Scarves
          </app-button>
          <app-button variant="secondary" (onClick)="searchTag('mug')">
            ☕ Mugs
          </app-button>
          <app-button variant="secondary" (onClick)="searchTag('jewelry')">
            💍 Jewelry
          </app-button>
          <app-button variant="secondary" (onClick)="searchTag('handmade')">
            ✨ Handmade
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  results: any[] = [];

  search(query: string) {
    if (query.trim()) {
      // Mock search results - in real app, this would call a service
      this.results = [
        {
          id: '1',
          name: 'Handmade Scarf',
          description: 'Soft wool scarf with floral patterns',
          price: 25.99,
          emoji: '🧣'
        }
      ];
    } else {
      this.results = [];
    }
  }

  searchTag(tag: string) {
    this.search(tag);
  }
}