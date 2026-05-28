export type AdminPermission =
  | 'admin.access'
  | 'dashboard.view'
  | 'orders.read'
  | 'orders.manage'
  | 'products.read'
  | 'products.manage'
  | 'inventory.manage'
  | 'users.read';

export type AdminRole = 'admin' | 'user';

const ROLE_PERMISSION_MAP: Readonly<Record<AdminRole, readonly AdminPermission[]>> = {
  admin: [
    'admin.access',
    'dashboard.view',
    'orders.read',
    'orders.manage',
    'products.read',
    'products.manage',
    'inventory.manage',
    'users.read',
  ],
  user: [],
};

export function normalizeRole(role: string | null | undefined): AdminRole {
  return role === 'admin' ? 'admin' : 'user';
}

export function permissionsForRole(role: string | null | undefined): readonly AdminPermission[] {
  return ROLE_PERMISSION_MAP[normalizeRole(role)];
}
