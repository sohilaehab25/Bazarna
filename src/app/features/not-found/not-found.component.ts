import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="not-found">
      <app-card>
        <div class="error-content">
          <div class="error-icon">😿</div>
          <h1>Oops! Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <div class="error-actions">
            <app-button routerLink="/">
              Go Home 🏠
            </app-button>
            <app-button variant="secondary" routerLink="/products">
              Browse Products 🛍️
            </app-button>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {}