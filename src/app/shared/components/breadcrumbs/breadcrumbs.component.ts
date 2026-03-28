import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <nav class="breadcrumbs" *ngIf="breadcrumbs.length > 0">
      <div class="container">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <a routerLink="/" class="breadcrumb-link">🏠 Home</a>
          </li>
          <li
            class="breadcrumb-item"
            *ngFor="let crumb of breadcrumbs; let isLast = last"
            [class.breadcrumb-item--active]="isLast">
            <span class="breadcrumb-separator" *ngIf="!isLast">›</span>
            <a
              *ngIf="!isLast"
              [routerLink]="crumb.path"
              class="breadcrumb-link">
              {{ crumb.label }}
            </a>
            <span *ngIf="isLast" class="breadcrumb-current">
              {{ crumb.label }}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  `,
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  // In a real app, this would be populated by a service based on current route
  breadcrumbs = [
    { label: 'Products', path: '/products' },
    { label: 'Handmade Scarf', path: '/products/scarf' }
  ];
}