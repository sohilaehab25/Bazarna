import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminProduct } from '../data-access/admin-products.contracts';
import { AdminProductsApiService } from '../data-access/admin-products-api.service';
import { AdminProductsStore } from '../data-access/admin-products.store';
import { computeStockHealthLabel, computeStockHealthClass } from './admin-product-detail.utils';

@Component({
  selector: 'app-admin-product-detail-page',
  imports: [TitleCasePipe],
  templateUrl: './admin-product-detail-page.component.html',
  styleUrl: './admin-product-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdminProductsApiService);
  private readonly store = inject(AdminProductsStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = signal<AdminProduct | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);

  readonly computeStockHealthLabel = computeStockHealthLabel;
  readonly computeStockHealthClass = computeStockHealthClass;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Invalid product ID');
      this.loading.set(false);
      return;
    }

    this.api.getProductById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load product details');
          this.loading.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/products']);
  }

  goEdit(): void {
    // Navigate back to products and open edit form via state
    this.router.navigate(['/admin/products'], {
      queryParams: { edit: this.product()?._id },
    });
  }

  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    const p = this.product();
    if (p) {
      this.store.deleteProduct(p._id);
      this.router.navigate(['/admin/products']);
    }
  }
}
