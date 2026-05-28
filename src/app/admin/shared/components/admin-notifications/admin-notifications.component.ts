import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

@Component({
  selector: 'app-admin-notifications',
  imports: [CommonModule],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNotificationsComponent {
  readonly isOpen = signal(false);
  readonly notifications = signal<AdminNotificationItem[]>([
    {
      id: 'n1',
      title: 'New order requires review',
      message: 'Order #A-109 was placed with cash payment.',
      createdAt: '2m ago',
      read: false,
    },
    {
      id: 'n2',
      title: 'Low stock warning',
      message: 'Classic Chocolate Bar is down to 4 units.',
      createdAt: '18m ago',
      read: false,
    },
    {
      id: 'n3',
      title: 'Category updated',
      message: 'Seasonal Collection was updated by Admin.',
      createdAt: '1h ago',
      read: true,
    },
  ]);

  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.read).length
  );

  toggleMenu(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  markAllAsRead(): void {
    this.notifications.update((items) =>
      items.map((item) => ({
        ...item,
        read: true,
      }))
    );
  }
}
