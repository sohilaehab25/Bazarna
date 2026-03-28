import { Component, input } from '@angular/core';

/**
 * Reusable Card Component with customizable styling
 *
 * Features:
 * - Cream background with soft shadow
 * - Rounded corners (25px)
 * - Hover effects
 * - Content projection for header, body, footer
 * - Customizable padding and elevation
 * - Perfect for Products, Features, Dashboard layouts
 *
 * Usage:
 * <app-card [padding]="'large'" [elevation]="'medium'">
 *   <div card-header>Header Content</div>
 *   <p>Main content goes here</p>
 *   <div card-footer>Footer Content</div>
 * </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  // Customization inputs
  padding = input<'small' | 'medium' | 'large'>('medium');
  elevation = input<'none' | 'low' | 'medium' | 'high'>('medium');
  hoverable = input<boolean>(true);
  variant = input<'default' | 'featured' | 'dashboard'>('default');

  // Reactive forms ready (can be extended with ControlValueAccessor if needed)
}