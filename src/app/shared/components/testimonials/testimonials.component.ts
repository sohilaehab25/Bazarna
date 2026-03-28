import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <section class="testimonials">
      <div class="container">
        <div class="section-header">
          <h2>💬 What Our Customers Say</h2>
          <p>Real stories from happy shoppers</p>
        </div>

        <div class="testimonials-grid">
          <app-card class="testimonial-card">
            <div class="testimonial">
              <div class="testimonial-rating">
                ⭐⭐⭐⭐⭐
              </div>
              <blockquote class="testimonial-quote">
                "I absolutely love the quality of the handmade items! Each piece
                tells a unique story and adds so much character to my home.
                The customer service is exceptional too!"
              </blockquote>
              <div class="testimonial-author">
                <div class="author-avatar">👩‍💼</div>
                <div class="author-info">
                  <div class="author-name">Sarah Mitchell</div>
                  <div class="author-location">New York, NY</div>
                </div>
              </div>
            </div>
          </app-card>

          <app-card class="testimonial-card">
            <div class="testimonial">
              <div class="testimonial-rating">
                ⭐⭐⭐⭐⭐
              </div>
              <blockquote class="testimonial-quote">
                "Found the perfect gift for my best friend! The artisan scarf
                was beautifully packaged and arrived exactly on time. She was
                thrilled with the unique design."
              </blockquote>
              <div class="testimonial-author">
                <div class="author-avatar">👨‍🎨</div>
                <div class="author-info">
                  <div class="author-name">David Chen</div>
                  <div class="author-location">Los Angeles, CA</div>
                </div>
              </div>
            </div>
          </app-card>

          <app-card class="testimonial-card">
            <div class="testimonial">
              <div class="testimonial-rating">
                ⭐⭐⭐⭐⭐
              </div>
              <blockquote class="testimonial-quote">
                "As someone who appreciates craftsmanship, I'm impressed by
                the attention to detail in every product. The website is
                beautiful and easy to navigate. Highly recommend!"
              </blockquote>
              <div class="testimonial-author">
                <div class="author-avatar">👩‍🎨</div>
                <div class="author-info">
                  <div class="author-name">Maria Rodriguez</div>
                  <div class="author-location">Austin, TX</div>
                </div>
              </div>
            </div>
          </app-card>
        </div>

        <div class="testimonials-stats">
          <div class="stat">
            <div class="stat-number">500+</div>
            <div class="stat-label">Happy Customers</div>
          </div>
          <div class="stat">
            <div class="stat-number">4.9</div>
            <div class="stat-stars">⭐⭐⭐⭐⭐</div>
            <div class="stat-label">Average Rating</div>
          </div>
          <div class="stat">
            <div class="stat-number">98%</div>
            <div class="stat-label">Satisfaction Rate</div>
          </div>
        </div>

        <div class="testimonials-cta">
          <app-card>
            <div class="cta-content">
              <h3>Ready to Join Our Happy Customers?</h3>
              <p>Start your handmade shopping journey today!</p>
              <app-button routerLink="/products">
                Shop Now 🛍️
              </app-button>
            </div>
          </app-card>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {}