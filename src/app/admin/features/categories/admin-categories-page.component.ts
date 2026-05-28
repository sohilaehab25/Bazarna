import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AdminCategoriesStore } from './data-access/admin-categories.store';
import { AdminCategory, CreateCategoryPayload, UpdateCategoryPayload } from './data-access/admin-categories.contracts';
import { AdminSmartTableComponent } from '../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminTablePaginationComponent } from '../../shared/components/admin-table-pagination/admin-table-pagination.component';
import { AdminCategoryFormComponent } from './components/admin-category-form.component';
import { AdminTableColumn } from '../../shared/components/admin-smart-table/admin-smart-table.component';

@Component({
  selector: 'app-admin-categories-page',
  imports: [AdminSmartTableComponent, AdminTablePaginationComponent, AdminCategoryFormComponent],
  templateUrl: './admin-categories-page.component.html',
  styleUrl: './admin-categories-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesPageComponent implements OnInit {
  protected readonly store = inject(AdminCategoriesStore);

  readonly showForm = signal(false);
  readonly editingCategory = signal<AdminCategory | null>(null);
  readonly showDeleteConfirm = signal<AdminCategory | null>(null);

  readonly columns: AdminTableColumn[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'slug', header: 'Slug' },
    {
      key: 'featured',
      header: 'Featured',
      formatter: (value) => value ? 'Yes' : 'No',
    },
    { key: 'productCount', header: 'Products', sortable: true },
    { key: 'createdAt', header: 'Created', sortable: true, formatter: (v) => v ? new Date(String(v)).toLocaleDateString() : '' },
  ];

  readonly tableRows = computed(() =>
    this.store.items().map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      featured: c.featured,
      productCount: c.productCount,
      createdAt: c.createdAt,
    }))
  );

  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly pagination = this.store.pagination;

  ngOnInit(): void {
    this.store.loadCategories();
  }

  openCreateForm(): void {
    this.editingCategory.set(null);
    this.showForm.set(true);
  }

  openEditForm(row: Record<string, unknown>): void {
    const category = this.store.items().find((c) => c._id === row['_id']);
    if (category) {
      this.editingCategory.set(category);
      this.showForm.set(true);
    }
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingCategory.set(null);
  }

  onSaveCategory(payload: CreateCategoryPayload | UpdateCategoryPayload): void {
    const editing = this.editingCategory();
    if (editing) {
      this.store.updateCategory(editing._id, payload);
    } else {
      this.store.createCategory(payload as CreateCategoryPayload);
    }
    this.closeForm();
  }

  requestDelete(row: Record<string, unknown>): void {
    const category = this.store.items().find((c) => c._id === row['_id']);
    if (category) this.showDeleteConfirm.set(category);
  }

  confirmDelete(): void {
    const cat = this.showDeleteConfirm();
    if (cat) {
      this.store.deleteCategory(cat._id);
      this.showDeleteConfirm.set(null);
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(null);
  }

  onPageChange(page: number): void {
    this.store.loadCategories({ page });
  }

  onPageSizeChange(pageSize: number): void {
    this.store.loadCategories({ page: 1, pageSize });
  }

  onSortChange(event: { key: string; direction: string }): void {
    this.store.loadCategories({
      sortBy: event.key as 'name' | 'createdAt' | 'productCount',
      sortOrder: event.direction as 'asc' | 'desc',
      page: 1,
    });
  }
}
