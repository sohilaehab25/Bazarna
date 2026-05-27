import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import {
  AdminPermission,
  AdminRole,
  normalizeRole,
  permissionsForRole,
} from '../models/admin-permission.model';

@Injectable({
  providedIn: 'root',
})
export class AdminRbacService {
  private readonly authService = inject(AuthService);

  readonly currentRole = computed<AdminRole>(() => normalizeRole(this.authService.user$()?.role));
  readonly permissions = computed(() => permissionsForRole(this.authService.user$()?.role));

  hasPermission(permission: AdminPermission): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(requiredPermissions: readonly AdminPermission[] | undefined): boolean {
    if (!requiredPermissions?.length) {
      return true;
    }

    return requiredPermissions.some((permission) => this.hasPermission(permission));
  }

  canAccessAdminPanel(): boolean {
    return this.hasPermission('admin.access');
  }
}
