import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="reviews">
      <section class="hero">
        <h1>Customer Reviews 💬</h1>
        <p>See what our happy customers are saying</p>
      </section>

      <section class="reviews-stats">
        <div class="stats-grid">
          <app-card>
            <div class="stat">
              <div class="stat-number">4.9</div>
              <div class="stat-stars">⭐⭐⭐⭐⭐</div>
              <div class="stat-label">Average Rating</div>
            </div>
          </app-card>
          <app-card>
            <div class="stat">
              <div class="stat-number">500+</div>
              <div class="stat-icon">💝</div>
              <div class="stat-label">Happy Customers</div>
            </div>
          </app-card>
          <app-card>
            <div class="stat">
              <div class="stat-number">1000+</div>
              <div class="stat-icon">🛍️</div>
              <div class="stat-label">Products Sold</div>
            </div>
          </app-card>
        </div>
      </section>

      <section class="reviews-list">
        <h2>Recent Reviews</h2>
        <div class="reviews-grid">
          <app-card>
            <div class="review">
              <div class="review-header">
                <div class="review-author">
                  <div class="author-avatar">👩</div>
                  <div class="author-info">
                    <div class="author-name">Sarah Johnson</div>
                    <div class="review-stars">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <div class="review-date">2 days ago</div>
              </div>
              <div class="review-product">Handmade Scarf</div>
              <p class="review-text">
                "Absolutely love this scarf! The quality is amazing and it arrived
                exactly as described. The colors are even more beautiful in person.
                Will definitely be ordering more items!"
              </p>
            </div>
          </app-card>

          <app-card>
            <div class="review">
              <div class="review-header">
                <div class="review-author">
                  <div class="author-avatar">👨</div>
                  <div class="author-info">
                    <div class="author-name">Mike Chen</div>
                    <div class="review-stars">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <div class="review-date">1 week ago</div>
              </div>
              <div class="review-product">Ceramic Mug</div>
              <p class="review-text">
                "Perfect mug for my morning coffee! The craftsmanship is outstanding
                and it feels so special. Great communication from the seller too!"
              </p>
            </div>
          </app-card>

          <app-card>
            <div class="review">
              <div class="review-header">
                <div class="review-author">
                  <div class="author-avatar">👩‍🦰</div>
                  <div class="author-info">
                    <div class="author-name">Emma Davis</div>
                    <div class="review-stars">⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <div class="review-date">2 weeks ago</div>
              </div>
              <div class="review-product">Vintage Jewelry Box</div>
              <p class="review-text">
                "This jewelry box exceeded my expectations! It's beautifully made
                and has the perfect amount of compartments. Love supporting
                handmade businesses!"
              </p>
            </div>
          </app-card>
        </div>
      </section>

      <section class="write-review">
        <app-card>
          <h2>Share Your Experience</h2>
          <p>Love your purchase? Let others know!</p>
          <app-button routerLink="/profile">
            Write a Review ✍️
          </app-button>
        </app-card>
      </section>
    </div>
  `,
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent {}