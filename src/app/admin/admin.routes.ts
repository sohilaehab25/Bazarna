import { Routes } from '@angular/router';
import { AdminRouteData } from './core/models/admin-route-data.model';
import { adminPermissionGuard } from './core/guards/admin-permission.guard';
import { AdminShellComponent } from './layout/admin-shell.component';

const dashboardRouteData: AdminRouteData = {
  breadcrumb: 'Dashboard',
  requiredPermissions: ['dashboard.view'],
};

const productsRouteData: AdminRouteData = {
  breadcrumb: 'Products',
  requiredPermissions: ['products.manage'],
};

const ordersRouteData: AdminRouteData = {
  breadcrumb: 'Orders',
  requiredPermissions: ['orders.read'],
};

const orderDetailRouteData: AdminRouteData = {
  breadcrumb: 'Order Detail',
  requiredPermissions: ['orders.read'],
};

const productDetailRouteData: AdminRouteData = {
  breadcrumb: 'Product Detail',
  requiredPermissions: ['products.manage'],
};

const categoriesRouteData: AdminRouteData = {
  breadcrumb: 'Categories',
  requiredPermissions: ['products.manage'],
};

const inventoryRouteData: AdminRouteData = {
  breadcrumb: 'Inventory',
  requiredPermissions: ['inventory.manage'],
};

const inventoryDashboardRouteData: AdminRouteData = {
  breadcrumb: 'Inventory Dashboard',
  requiredPermissions: ['inventory.manage'],
};

const inventoryLogsRouteData: AdminRouteData = {
  breadcrumb: 'Inventory Logs',
  requiredPermissions: ['inventory.manage'],
};

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: dashboardRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'products',
        data: productsRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/products/admin-products-page.component').then(
            (m) => m.AdminProductsPageComponent
          ),
      },
      {
        path: 'products/:id',
        data: productDetailRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/products/detail/admin-product-detail-page.component').then(
            (m) => m.AdminProductDetailPageComponent
          ),
      },
      {
        path: 'categories',
        data: categoriesRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/categories/admin-categories-page.component').then(
            (m) => m.AdminCategoriesPageComponent
          ),
      },
      {
        path: 'orders',
        data: ordersRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/orders/admin-orders-page.component').then(
            (m) => m.AdminOrdersPageComponent
          ),
      },
      {
        path: 'orders/:id',
        data: orderDetailRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/orders/detail/admin-order-detail-page.component').then(
            (m) => m.AdminOrderDetailPageComponent
          ),
      },
      {
        path: 'inventory',
        data: inventoryRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/inventory/admin-inventory-page.component').then(
            (m) => m.AdminInventoryPageComponent
          ),
      },
      {
        path: 'inventory/dashboard',
        data: inventoryDashboardRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/inventory/dashboard/admin-inventory-dashboard.component').then(
            (m) => m.AdminInventoryDashboardComponent
          ),
      },
      {
        path: 'inventory/logs',
        data: inventoryLogsRouteData,
        canActivate: [adminPermissionGuard],
        loadComponent: () =>
          import('./features/inventory/logs/admin-inventory-logs.component').then(
            (m) => m.AdminInventoryLogsComponent
          ),
      },
      {
        path: 'unauthorized',
        data: { breadcrumb: 'Unauthorized' },
        loadComponent: () =>
          import('./features/unauthorized/admin-unauthorized.component').then(
            (m) => m.AdminUnauthorizedComponent
          ),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
