import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HeroBannerComponent } from '../../shared/components/hero-banner/hero-banner.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ProductsService } from '../../shared/services/products.service';
import { AuthService } from '../../shared/services/auth.service';

interface Feature {
  icon: string;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroBannerComponent,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private productsService = inject(ProductsService);
  private router = inject(Router);
  private authService = inject(AuthService);

  categories = this.productsService.getCategories();
  isLoggedIn = this.authService.isLoggedIn();
  showAuthPopup = signal(!this.isLoggedIn);
  
  // Pre-compute category counts for performance
  categoryCounts = computed(() => {
    const counts: Record<string, number> = {};
    this.categories().forEach(category => {
      counts[category] = this.productsService.getProductsByCategory(category)().length;
    });
    return counts;
  });

  features: Feature[] = [
    {
      icon: '🏆',
      title: 'Quality Guaranteed',
      description: 'Every product is carefully inspected for the highest quality standards',
      link: '/products',
      linkText: 'Browse Products'
    },
    {
      icon: '🚚',
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50 with fast and secure delivery',
      link: '/products',
      linkText: 'Start Shopping'
    },
    {
      icon: '💬',
      title: '24/7 Support',
      description: 'Our friendly team is here to help with any questions you have',
      link: '/contact',
      linkText: 'Contact Us'
    }
  ];

  navigateToCategory(category: string): void {
    this.router.navigate(['/products'], { queryParams: { category } });
  }

  getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'Accessories': '🧣',
      'Home': '🏠',
      'Decor': '🏡', // Changed to avoid duplicate
      'Groceries': '🥕',
      'Cheese': '🧀',
      'Sauces': '🍯',
      'Kitchen': '☕',
      'Jewelry': '💎', // Changed to diamond for distinction
      'Art': '🎨'
    };
    return emojiMap[category] || '📦';
  }

  getCategoryCount(category: string): number {
    return this.categoryCounts()[category] || 0;
  }

  onCategoryKeyDown(event: KeyboardEvent, category: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToCategory(category);
    }
  }

  closeAuthPopup(): void {
    this.showAuthPopup.set(false);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
    this.closeAuthPopup();
  }
}