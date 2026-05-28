import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminLayoutService } from '../core/services/admin-layout.service';
import { AdminSidebarComponent } from '../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../shared/components/admin-topbar/admin-topbar.component';
import { AdminBreadcrumbsComponent } from '../shared/components/admin-breadcrumbs/admin-breadcrumbs.component';

@Component({
  selector: 'app-admin-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebarComponent,
    AdminTopbarComponent,
    AdminBreadcrumbsComponent,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  readonly layout = inject(AdminLayoutService);

  handleNavigation(): void {
    this.layout.closeMobileSidebar();
  }
}
