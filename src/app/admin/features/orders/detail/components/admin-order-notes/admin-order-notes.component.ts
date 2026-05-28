import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { AdminOrderDetailNote } from '../../data-access/admin-order-detail.contracts';

@Component({
  selector: 'app-admin-order-notes',
  templateUrl: './admin-order-notes.component.html',
  styleUrl: './admin-order-notes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderNotesComponent {
  readonly notes = input.required<readonly AdminOrderDetailNote[]>();
  readonly submitting = input(false);
  readonly error = input<string | null>(null);

  readonly addNote = output<string>();

  readonly noteBody = signal('');
  readonly MAX_LENGTH = 1000;

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  onNoteInput(event: Event): void {
    this.noteBody.set((event.target as HTMLTextAreaElement).value);
  }

  onSubmit(): void {
    const body = this.noteBody().trim();
    if (!body || this.submitting()) return;
    this.addNote.emit(body);
    this.noteBody.set('');
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';
    return this.dateTimeFormatter.format(date);
  }
}
