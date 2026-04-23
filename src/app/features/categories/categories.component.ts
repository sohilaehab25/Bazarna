import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ProductsService } from '../../shared/services/products.service';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {
    private productsService = inject(ProductsService);

    allProducts = this.productsService.getProducts();
    categories = computed(() => {
        const products = this.allProducts();
        const categoriesMap = new Map<string, { name: string, count: number }>();
      
        products.forEach(p => {
            const catName = p.categoryId.name;
            if (!categoriesMap.has(catName)) {
                categoriesMap.set(catName, { name: catName, count: 0 });
            }
            categoriesMap.get(catName)!.count++;
        });

        return Array.from(categoriesMap.values());
    });
}