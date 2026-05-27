import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AdminRouteData } from '../models/admin-route-data.model';
import { AdminRbacService } from '../services/admin-rbac.service';

export const adminPermissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const rbac = inject(AdminRbacService);
  const routeData = route.data as AdminRouteData;

  if (rbac.hasAnyPermission(routeData.requiredPermissions)) {
    return true;
  }

  return router.createUrlTree(['/admin/unauthorized']);
};
