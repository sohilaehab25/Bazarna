import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminLayoutService } from '../../../core/services/admin-layout.service';
import { AdminNavigationService } from '../../../core/services/admin-navigation.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebarComponent {
  readonly layout = inject(AdminLayoutService);
  private readonly navigation = inject(AdminNavigationService);

  readonly menuItems = this.navigation.visibleMenuItems;
  readonly navigate = output<void>();

  onItemSelected(): void {
    this.layout.closeMobileSidebar();
    this.navigate.emit();
  }

  toggleSidebar(): void {
    this.layout.toggleSidebarCollapsed();
  }
}
