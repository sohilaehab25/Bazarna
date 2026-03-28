import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <nav class="pagination" *ngIf="totalPages > 1">
      <div class="pagination-info">
        <span>Showing {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ getEndItem() }} of {{ totalItems }} products</span>
      </div>

      <div class="pagination-controls">
        <app-button
          variant="secondary"
          size="small"
          [disabled]="currentPage === 1"
          (onClick)="goToPage(currentPage - 1)">
          ‹ Previous
        </app-button>

        <div class="page-numbers">
          <button
            class="page-number"
            *ngFor="let page of visiblePages"
            [class.page-number--active]="page === currentPage"
            (click)="goToPage(page)">
            {{ page }}
          </button>
        </div>

        <app-button
          variant="secondary"
          size="small"
          [disabled]="currentPage === totalPages"
          (onClick)="goToPage(currentPage + 1)">
          Next ›
        </app-button>
      </div>

      <div class="pagination-jumper">
        <span>Go to page:</span>
        <input
          type="number"
          [value]="currentPage"
          (keyup.enter)="goToPage($any($event.target).value)"
          min="1"
          [max]="totalPages"
          class="page-jumper-input">
      </div>
    </nav>
  `,
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  currentPage = 1;
  totalItems = 125;
  itemsPerPage = 12;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getEndItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goToPage(page: number | string) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
      // In real app, emit event to parent component
      console.log('Navigate to page:', pageNum);
    }
  }
}