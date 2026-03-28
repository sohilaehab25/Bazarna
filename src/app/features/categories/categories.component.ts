import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="categories">
      <section class="hero">
        <h1>Shop by Category 🛍️</h1>
        <p>Find exactly what you're looking for</p>
      </section>

      <section class="categories-grid">
        <app-card>
          <div class="category-card">
            <div class="category-icon">🧣</div>
            <h3>Accessories</h3>
            <p>Scarves, hats, bags, and more</p>
            <div class="category-stats">
              <span class="stat">25 items</span>
              <span class="stat">⭐ 4.8</span>
            </div>
            <app-button routerLink="/products" [queryParams]="{category: 'accessories'}">
              Shop Accessories
            </app-button>
          </div>
        </app-card>

        <app-card>
          <div class="category-card">
            <div class="category-icon">🏠</div>
            <h3>Home & Decor</h3>
            <p>Beautiful items for your home</p>
            <div class="category-stats">
              <span class="stat">40 items</span>
              <span class="stat">⭐ 4.9</span>
            </div>
            <app-button routerLink="/products" [queryParams]="{category: 'home'}">
              Shop Home Decor
            </app-button>
          </div>
        </app-card>

        <app-card>
          <div class="category-card">
            <div class="category-icon">☕</div>
            <h3>Kitchen</h3>
            <p>Mugs, plates, and kitchenware</p>
            <div class="category-stats">
              <span class="stat">18 items</span>
              <span class="stat">⭐ 4.7</span>
            </div>
            <app-button routerLink="/products" [queryParams]="{category: 'kitchen'}">
              Shop Kitchen
            </app-button>
          </div>
        </app-card>

        <app-card>
          <div class="category-card">
            <div class="category-icon">💍</div>
            <h3>Jewelry</h3>
            <p>Earrings, necklaces, and accessories</p>
            <div class="category-stats">
              <span class="stat">32 items</span>
              <span class="stat">⭐ 4.9</span>
            </div>
            <app-button routerLink="/products" [queryParams]="{category: 'jewelry'}">
              Shop Jewelry
            </app-button>
          </div>
        </app-card>

        <app-card>
          <div class="category-card">
            <div class="category-icon">👗</div>
            <h3>Clothing</h3>
            <p>Dresses, tops, and handmade garments</p>
            <div class="category-stats">
              <span class="stat">15 items</span>
              <span class="stat">⭐ 4.6</span>
            </div>
            <app-button routerLink="/products" [queryParams]="{category: 'clothing'}">
              Shop Clothing
            </app-button>
          </div>
        </app-card>

        <app-card>
          <div class="category-card">
            <div class="category-icon">🎨</div>
            <h3>Art & Crafts</h3>
            <p>Paintings, prints, and handmade art</p>
            <div class="category-stats">
              <span class="stat">28 items</span>
              <span class="stat">⭐ 4.8</span>
            </div>
            <app-button routerLink="/products" [queryParams]="{category: 'art'}">
              Shop Art
            </app-button>
          </div>
        </app-card>
      </section>

      <section class="featured-category">
        <app-card>
          <div class="featured-content">
            <div class="featured-text">
              <h2>✨ New Arrivals</h2>
              <p>Check out our latest handmade treasures</p>
              <app-button routerLink="/products" [queryParams]="{sort: 'newest'}">
                View New Items
              </app-button>
            </div>
            <div class="featured-emoji">🆕</div>
          </div>
        </app-card>
      </section>
    </div>
  `,
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {}