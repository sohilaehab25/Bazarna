import { Component, input, output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Reusable Input Component with icon support and reactive forms integration
 *
 * Features:
 * - Left icon support
 * - Pink glow focus state
 * - Rounded corners
 * - Placeholder styling
 * - Multiple sizes (small, medium, large)
 * - Reactive forms ready (ControlValueAccessor)
 * - Accessibility compliant
 *
 * Usage:
 * <app-input
 *   type="email"
 *   placeholder="Enter your email"
 *   icon="✉️"
 *   size="medium"
 *   [required]="true"
 *   [disabled]="false"
 *   (onFocus)="handleFocus($event)"
 *   (onBlur)="handleBlur($event)">
 * </app-input>
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  // Input properties
  type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'>('text');
  placeholder = input<string>('');
  icon = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  size = input<'small' | 'medium' | 'large'>('medium');

  // Events
  onFocus = output<FocusEvent>();
  onBlur = output<FocusEvent>();
  onInput = output<Event>();

  // ControlValueAccessor implementation
  private onChange = (value: any) => {};
  private onTouched = () => {};

  value: string = '';

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // This would be handled by the disabled input property
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onInput.emit(event);
  }

  onFocusEvent(event: FocusEvent): void {
    this.onFocus.emit(event);
  }

  onBlurEvent(event: FocusEvent): void {
    this.onTouched();
    this.onBlur.emit(event);
  }
}