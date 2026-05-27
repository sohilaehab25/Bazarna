import { Injectable, computed, inject } from '@angular/core';
import { AdminMenuItem } from '../models/admin-menu.model';
import { AdminRbacService } from './admin-rbac.service';

const ADMIN_MENU_ITEMS: readonly AdminMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/admin/dashboard',
    iconText: 'DB',
    description: 'Business KPIs and analytics',
    requiredPermissions: ['dashboard.view'],
  },
  {
    id: 'products',
    label: 'Products',
    route: '/admin/products',
    iconText: 'PR',
    description: 'Product management workspace',
    requiredPermissions: ['products.manage'],
  },
  {
    id: 'orders',
    label: 'Orders',
    route: '/admin/orders',
    iconText: 'OR',
    description: 'Order operations and fulfillment',
    requiredPermissions: ['orders.read'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    route: '/admin/inventory',
    iconText: 'IN',
    description: 'Stock tracking and management',
    requiredPermissions: ['inventory.manage'],
  },
];

@Injectable({
  providedIn: 'root',
})
export class AdminNavigationService {
  private readonly rbac = inject(AdminRbacService);

  readonly allMenuItems = computed(() => ADMIN_MENU_ITEMS);
  readonly visibleMenuItems = computed(() =>
    ADMIN_MENU_ITEMS.filter((item) => this.rbac.hasAnyPermission(item.requiredPermissions))
  );
}
