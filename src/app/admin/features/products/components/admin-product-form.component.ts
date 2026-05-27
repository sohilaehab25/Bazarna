import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminProduct, AdminProductStatus, CreateProductPayload, UpdateProductPayload } from '../data-access/admin-products.contracts';
import { Category } from '../../../../../app.type';

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductFormComponent implements OnInit {
  readonly product = input<AdminProduct | null>(null);
  readonly categories = input.required<readonly Category[]>();
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CreateProductPayload | UpdateProductPayload>();
  readonly cancel = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    categoryId: ['', Validators.required],
    imageUrl: ['', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
    lowStockThreshold: [10, [Validators.required, Validators.min(0)]],
    status: ['active' as AdminProductStatus],
    tags: [''],
    seoTitle: [''],
    seoDescription: [''],
  });

  readonly isEdit = signal(false);

  readonly statusOptions: { value: AdminProductStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ];

  ngOnInit(): void {
    const p = this.product();
    if (p) {
      this.isEdit.set(true);
      this.form.patchValue({
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId: p.categoryId?._id ?? '',
        imageUrl: p.imageUrl,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold ?? 10,
        status: p.status ?? 'active',
        tags: (p.tags ?? []).join(', '),
        seoTitle: p.seoTitle ?? '',
        seoDescription: p.seoDescription ?? '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tags = raw.tags
      ? raw.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    const payload: CreateProductPayload = {
      name: raw.name,
      description: raw.description,
      price: raw.price,
      categoryId: raw.categoryId,
      imageUrl: raw.imageUrl,
      stock: raw.stock,
      lowStockThreshold: raw.lowStockThreshold,
      status: raw.status,
      tags,
      seoTitle: raw.seoTitle || undefined,
      seoDescription: raw.seoDescription || undefined,
    };

    this.save.emit(payload);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }
}
