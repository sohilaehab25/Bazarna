import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-table-pagination',
  imports: [CommonModule],
  templateUrl: './admin-table-pagination.component.html',
  styleUrl: './admin-table-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTablePaginationComponent {
  readonly page = input(1);
  readonly pageSize = input(12);
  readonly totalItems = input(0);
  readonly totalPages = input(1);
  readonly disabled = input(false);

  readonly pageSizeOptions = input<readonly number[]>([10, 12, 20, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  onPrevious(): void {
    if (this.disabled()) {
      return;
    }

    const next = Math.max(this.page() - 1, 1);
    if (next !== this.page()) {
      this.pageChange.emit(next);
    }
  }

  onNext(): void {
    if (this.disabled()) {
      return;
    }

    const next = Math.min(this.page() + 1, this.totalPages());
    if (next !== this.page()) {
      this.pageChange.emit(next);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const parsed = Number.parseInt(target.value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.pageSizeChange.emit(parsed);
    }
  }

  rangeLabel(): string {
    if (this.totalItems() === 0) {
      return 'No records';
    }

    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), this.totalItems());

    return `${start}-${end} of ${this.totalItems()}`;
  }
}
