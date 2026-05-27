import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AdminTableCellType =
  | 'text'
  | 'currency'
  | 'number'
  | 'date'
  | 'badge';

export type AdminTableCellValue = string | number | boolean | null | undefined;

type AdminTableCellFormatter = (value: AdminTableCellValue, row: AdminTableRow) => string;
type AdminTableBadgeClassResolver = (value: AdminTableCellValue, row: AdminTableRow) => string;

export interface AdminTableColumn {
  key: string;
  header: string;
  type?: AdminTableCellType;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  formatter?: AdminTableCellFormatter;
  badgeClassResolver?: AdminTableBadgeClassResolver;
}

export type AdminTableRow = Record<string, AdminTableCellValue>;

export interface AdminTableSortChange {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-admin-smart-table',
  imports: [CommonModule],
  templateUrl: './admin-smart-table.component.html',
  styleUrl: './admin-smart-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSmartTableComponent {
  readonly columns = input.required<readonly AdminTableColumn[]>();
  readonly rows = input<readonly AdminTableRow[]>([]);

  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyMessage = input('No rows to display.');

  readonly selectable = input(false);
  readonly rowIdKey = input('_id');
  readonly selectedRowIds = input<readonly string[]>([]);

  readonly sortKey = input<string | null>(null);
  readonly sortDirection = input<'asc' | 'desc'>('asc');

  readonly sortChange = output<AdminTableSortChange>();
  readonly selectedRowIdsChange = output<readonly string[]>();
  readonly rowClick = output<AdminTableRow>();

  private readonly selectedRowIdSet = computed(() => new Set(this.selectedRowIds()));
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-US');

  requestSort(column: AdminTableColumn): void {
    if (!column.sortable) {
      return;
    }

    const nextDirection: 'asc' | 'desc' =
      this.sortKey() === column.key && this.sortDirection() === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({
      key: column.key,
      direction: nextDirection,
    });
  }

  onToggleAllRows(event: Event): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;

    if (checked) {
      const ids = [...new Set(this.rows().map((row) => this.getRowId(row)).filter((id) => id.length > 0))];
      this.selectedRowIdsChange.emit(ids);
      return;
    }

    this.selectedRowIdsChange.emit([]);
  }

  onToggleRow(event: Event, row: AdminTableRow): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    const rowId = this.getRowId(row);
    const selected = new Set(this.selectedRowIdSet());

    if (checked) {
      selected.add(rowId);
    } else {
      selected.delete(rowId);
    }

    this.selectedRowIdsChange.emit([...selected]);
  }

  onRowClick(row: AdminTableRow): void {
    this.rowClick.emit(row);
  }

  isRowSelected(row: AdminTableRow): boolean {
    return this.selectedRowIdSet().has(this.getRowId(row));
  }

  areAllVisibleRowsSelected(): boolean {
    const rows = this.rows();
    if (rows.length === 0) {
      return false;
    }

    const selected = this.selectedRowIdSet();
    return rows.every((row) => selected.has(this.getRowId(row)));
  }

  getRowId(row: AdminTableRow): string {
    const rawValue = row[this.rowIdKey()];
    return rawValue === null || rawValue === undefined ? '' : String(rawValue);
  }

  getRowTrackKey(row: AdminTableRow, index: number): string | number {
    const rowId = this.getRowId(row);
    return rowId.length > 0 ? rowId : index;
  }

  getColumnAlignment(column: AdminTableColumn): 'left' | 'center' | 'right' {
    if (column.align) {
      return column.align;
    }

    if (column.type === 'currency' || column.type === 'number') {
      return 'right';
    }

    return 'left';
  }

  getSortState(column: AdminTableColumn): 'none' | 'ascending' | 'descending' {
    if (!column.sortable || this.sortKey() !== column.key) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  formatCell(row: AdminTableRow, column: AdminTableColumn): string {
    const rawValue = this.getCellValue(row, column);

    if (column.formatter) {
      return column.formatter(rawValue, row);
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return 'N/A';
    }

    if (column.type === 'currency') {
      const numberValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
      return Number.isFinite(numberValue) ? this.currencyFormatter.format(numberValue) : String(rawValue);
    }

    if (column.type === 'date') {
      const date = new Date(String(rawValue));
      return Number.isNaN(date.getTime()) ? String(rawValue) : this.dateFormatter.format(date);
    }

    return String(rawValue);
  }

  getBadgeClass(row: AdminTableRow, column: AdminTableColumn): string {
    if (!column.badgeClassResolver) {
      return 'admin-smart-table__badge--neutral';
    }

    return column.badgeClassResolver(this.getCellValue(row, column), row);
  }

  private getCellValue(row: AdminTableRow, column: AdminTableColumn): AdminTableCellValue {
    return row[column.key];
  }
}
