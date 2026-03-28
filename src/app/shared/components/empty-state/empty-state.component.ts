import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  icon = input<string>('📦');
  title = input<string>('Nothing here yet');
  message = input<string>('Start exploring to fill this space!');
  actionText = input<string>();

  onAction = output<void>();
}