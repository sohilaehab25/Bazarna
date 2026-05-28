import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-search',
  imports: [CommonModule],
  templateUrl: './admin-search.component.html',
  styleUrl: './admin-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSearchComponent {
  readonly query = signal('');
  readonly searchSubmitted = output<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    this.searchSubmitted.emit(this.query().trim());
  }
}
