import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="about">
      <section class="hero">
        <h1>About Bazarna 💕</h1>
        <p>Your destination for your products</p>
      </section>

      <section class="story">
        <app-card>
          <h2>Our Story</h2>
          <p>
            From cozy scarves to elegant jewelry boxes, each product is selected
            with love and attention to detail. We create a warm, welcoming space
            where creativity meets craftsmanship.
          </p>
        </app-card>
      </section>

      <section class="values">
        <h2>Our Values</h2>
        <div class="values-grid">
          <app-card>
            <div class="value">
              <div class="value__icon">✨</div>
              <h3>Quality</h3>
              <p>Every item is carefully inspected to ensure the highest quality standards.</p>
            </div>
          </app-card>
          <app-card>
            <div class="value">
              <div class="value__icon">🌱</div>
              <h3>Sustainability</h3>
              <p>We support eco-friendly practices and sustainable crafting methods.</p>
            </div>
          </app-card>
          <app-card>
            <div class="value">
              <div class="value__icon">🤝</div>
              <h3>Community</h3>
              <p>We foster a supportive community of artisans and craft lovers.</p>
            </div>
          </app-card>
        </div>
      </section>

      <section class="cta">
        <app-card>
          <h2>Ready to Start Shopping?</h2>
          <p>Discover your next favorite handmade treasure today!</p>
          <app-button routerLink="/products">
            Browse Our Collection 🛍️
          </app-button>
        </app-card>
      </section>
    </div>
  `,
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {}