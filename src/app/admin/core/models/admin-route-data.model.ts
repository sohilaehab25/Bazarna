import { AdminPermission } from './admin-permission.model';

export interface AdminRouteData {
  breadcrumb?: string;
  requiredPermissions?: readonly AdminPermission[];
}
