import { AdminPermission } from './admin-permission.model';

export interface AdminMenuItem {
  id: string;
  label: string;
  route: string;
  iconText: string;
  description: string;
  requiredPermissions: readonly AdminPermission[];
}
