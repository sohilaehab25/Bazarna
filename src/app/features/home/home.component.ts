import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ProductsService } from '../../shared/services/products.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
  features = this.productsService.getFeaturedInfo();
  isLoggedIn = this.authService.isLoggedIn;
  private authPopupDismissed = signal(false);
  showAuthPopup = computed(() => !this.isLoggedIn() && !this.authPopupDismissed());
  
  // Pre-compute category counts for performance
  categoryCounts = computed(() => {
    const counts: Record<string, number> = {};
    this.categories().forEach(category => {
      counts[category] = this.productsService.getProductsByCategory(category)().length;
    });
    return counts;
  });

  navigateToCategory(category: string): void {
    this.router.navigate(['/products'], { queryParams: { category } });
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
    this.authPopupDismissed.set(true);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
    this.closeAuthPopup();
  }
}