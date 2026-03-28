import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-footer-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <nav class="footer-nav">
      <div class="nav-section">
        <h4>Shop</h4>
        <ul>
          <li><a routerLink="/products">All Products</a></li>
          <li><a routerLink="/categories">Categories</a></li>
          <li><a routerLink="/search">Search</a></li>
          <li><a routerLink="/wishlist">Wishlist</a></li>
        </ul>
      </div>

      <div class="nav-section">
        <h4>Account</h4>
        <ul>
          <li><a routerLink="/profile">My Profile</a></li>
          <li><a routerLink="/cart">Shopping Cart</a></li>
          <li><a routerLink="/orders">Order History</a></li>
          <li><a routerLink="/login">Login</a></li>
        </ul>
      </div>

      <div class="nav-section">
        <h4>Support</h4>
        <ul>
          <li><a routerLink="/contact">Contact Us</a></li>
          <li><a routerLink="/about">About Us</a></li>
          <li><a routerLink="/reviews">Reviews</a></li>
          <li><a href="#" (click)="openHelp($event)">Help Center</a></li>
        </ul>
      </div>

      <div class="nav-section">
        <h4>Connect</h4>
        <div class="social-links">
          <a href="#" class="social-link" aria-label="Facebook">📘</a>
          <a href="#" class="social-link" aria-label="Instagram">📷</a>
          <a href="#" class="social-link" aria-label="Twitter">🐦</a>
          <a href="#" class="social-link" aria-label="Pinterest">📌</a>
        </div>
        <p class="newsletter-text">
          Subscribe to our newsletter for updates and exclusive offers!
        </p>
      </div>
    </nav>
  `,
  styleUrls: ['./footer-nav.component.scss']
})
export class FooterNavComponent {
  openHelp(event: Event) {
    event.preventDefault();
    alert('Help center coming soon! 📚');
  }
}