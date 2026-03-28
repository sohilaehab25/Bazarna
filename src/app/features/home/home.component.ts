import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeroBannerComponent } from '../../shared/components/hero-banner/hero-banner.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ProductShowcaseComponent } from '../../shared/components/product-showcase/product-showcase.component';
import { ProductsService } from '../../shared/services/products.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroBannerComponent,
    CardComponent,
    ButtonComponent,
    ProductShowcaseComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private productsService = inject(ProductsService);

  featuredProducts = this.productsService.getProducts();
}