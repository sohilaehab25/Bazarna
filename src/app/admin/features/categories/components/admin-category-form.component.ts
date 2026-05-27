import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminCategory, CreateCategoryPayload, UpdateCategoryPayload } from '../data-access/admin-categories.contracts';

@Component({
  selector: 'app-admin-category-form',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-category-form.component.html',
  styleUrl: './admin-category-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoryFormComponent implements OnInit {
  readonly category = input<AdminCategory | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CreateCategoryPayload | UpdateCategoryPayload>();
  readonly cancel = output<void>();

  form!: FormGroup;

  private readonly fb = new FormBuilder();

  ngOnInit(): void {
    const c = this.category();
    this.form = this.fb.nonNullable.group({
      name: [c?.name ?? '', Validators.required],
      description: [c?.description ?? ''],
      slug: [c?.slug ?? ''],
      imageUrl: [c?.imageUrl ?? ''],
      featured: [c?.featured ?? false],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateCategoryPayload = {
      name: value.name,
      description: value.description,
      slug: value.slug || undefined,
      imageUrl: value.imageUrl || undefined,
      featured: value.featured,
    };
    this.save.emit(payload);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
