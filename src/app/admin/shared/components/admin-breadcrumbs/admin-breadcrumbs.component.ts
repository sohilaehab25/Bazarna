import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminBreadcrumbService } from '../../../core/services/admin-breadcrumb.service';

@Component({
  selector: 'app-admin-breadcrumbs',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-breadcrumbs.component.html',
  styleUrl: './admin-breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBreadcrumbsComponent {
  private readonly breadcrumbService = inject(AdminBreadcrumbService);
  readonly breadcrumbs = this.breadcrumbService.breadcrumbs;
}
