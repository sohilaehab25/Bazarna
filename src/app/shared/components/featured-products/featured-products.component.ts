import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <section class="featured-products">
      <div class="container">
        <div class="section-header">
          <h2>✨ Featured Products</h2>
          <p>Handpicked treasures just for you</p>
        </div>

        <div class="products-showcase">
          <div class="main-product">
            <app-card>
              <div class="featured-item">
                <div class="featured-badge">⭐ Featured</div>
                <div class="product-image">
                  <div class="product-emoji">🧣</div>
                </div>
                <div class="product-info">
                  <h3>Artisan Wool Scarf</h3>
                  <p class="product-description">
                    Handcrafted with love using the finest merino wool.
                    Perfect for cozy winter days.
                  </p>
                  <div class="product-meta">
                    <span class="price">$45.99</span>
                    <span class="rating">⭐⭐⭐⭐⭐ (4.9)</span>
                  </div>
                  <app-button routerLink="/products">
                    Shop Now
                  </app-button>
                </div>
              </div>
            </app-card>
          </div>

          <div class="side-products">
            <app-card>
              <div class="side-item">
                <div class="product-emoji">☕</div>
                <h4>Ceramic Mug</h4>
                <p class="price">$18.50</p>
                <app-button variant="secondary" size="small" routerLink="/products">
                  View
                </app-button>
              </div>
            </app-card>

            <app-card>
              <div class="side-item">
                <div class="product-emoji">💍</div>
                <h4>Jewelry Box</h4>
                <p class="price">$32.99</p>
                <app-button variant="secondary" size="small" routerLink="/products">
                  View
                </app-button>
              </div>
            </app-card>
          </div>
        </div>

        <div class="view-all">
          <app-button routerLink="/products">
            View All Products 🛍️
          </app-button>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./featured-products.component.scss']
})
export class FeaturedProductsComponent {}