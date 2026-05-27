import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutService } from '../../../core/services/admin-layout.service';
import { AdminSearchComponent } from '../admin-search/admin-search.component';
import { AdminNotificationsComponent } from '../admin-notifications/admin-notifications.component';
import { AdminUserMenuComponent } from '../admin-user-menu/admin-user-menu.component';

@Component({
  selector: 'app-admin-topbar',
  imports: [
    CommonModule,
    AdminSearchComponent,
    AdminNotificationsComponent,
    AdminUserMenuComponent,
  ],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTopbarComponent {
  readonly layout = inject(AdminLayoutService);
}
