import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

/**
 * Reusable Modal Component with animations and overlay
 *
 * Features:
 * - Centered positioning
 * - Smooth open/close animations
 * - Dark overlay background
 * - Close button (X)
 * - ESC key support
 * - Click outside to close
 * - Reusable for item details, forms, confirmations
 *
 * Usage:
 * <app-modal
 *   [isOpen]="showModal"
 *   [title]="'Item Details'"
 *   (closeModal)="showModal = false">
 *   <p>Modal content goes here</p>
 * </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  // Input properties
  isOpen = input<boolean>(false);
  title = input<string>('');
  size = input<'small' | 'medium' | 'large' | 'fullscreen'>('medium');
  showCloseButton = input<boolean>(true);
  closeOnOverlayClick = input<boolean>(true);
  closeOnEscape = input<boolean>(true);

  // Output events
  closeModal = output<void>();

  // Internal state
  isVisible = signal(false);
  isAnimating = signal(false);

  constructor() {
    // Handle open/close animations
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.isVisible.set(true);
        this.isAnimating.set(true);
        // Add ESC key listener
        if (this.closeOnEscape()) {
          document.addEventListener('keydown', this.handleKeyDown);
        }
      } else {
        this.isAnimating.set(false);
        // Remove ESC key listener after animation
        setTimeout(() => {
          this.isVisible.set(false);
          document.removeEventListener('keydown', this.handleKeyDown);
        }, 300); // Match animation duration
      }
    });
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.closeOnEscape()) {
      this.close();
    }
  };

  close() {
    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if (this.closeOnOverlayClick() && event.target === event.currentTarget) {
      this.close();
    }
  }

  // Prevent event bubbling for modal content
  onModalContentClick(event: MouseEvent) {
    event.stopPropagation();
  }

  hasFooterContent(): boolean {
    // This will be determined by checking if modal-footer content is projected
    // For now, we'll use a simple check - can be enhanced with ViewChild if needed
    return false; // Will be overridden by content projection detection
  }

  // Reactive forms ready - can be extended with ControlValueAccessor if needed
  // for form modals that need to integrate with reactive forms
}