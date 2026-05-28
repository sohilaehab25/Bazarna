import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-widget-shell',
  imports: [CommonModule],
  templateUrl: './admin-widget-shell.component.html',
  styleUrl: './admin-widget-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminWidgetShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly emptyMessage = input('No data available.');
}
