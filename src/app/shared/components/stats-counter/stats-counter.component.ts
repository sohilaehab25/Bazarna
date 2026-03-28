import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <section class="stats-counter">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item" *ngFor="let stat of stats">
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-number">{{ stat.number | number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-description">{{ stat.description }}</div>
          </div>
        </div>

        <div class="stats-cta">
          <app-card>
            <div class="cta-content">
              <h3>Join Our Growing Community! 🌟</h3>
              <p>Be part of the handmade revolution</p>
              <app-button routerLink="/products">
                Start Shopping Today
              </app-button>
            </div>
          </app-card>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./stats-counter.component.scss']
})
export class StatsCounterComponent {
  stats = [
    {
      icon: '💝',
      number: 500,
      label: 'Happy Customers',
      description: 'Satisfied shoppers worldwide'
    },
    {
      icon: '🛍️',
      number: 1000,
      label: 'Products Sold',
      description: 'Handmade treasures delivered'
    },
    {
      icon: '🎨',
      number: 50,
      label: 'Artisans',
      description: 'Talented creators featured'
    },
    {
      icon: '⭐',
      number: 4.9,
      label: 'Average Rating',
      description: 'Customer satisfaction score'
    }
  ];
}