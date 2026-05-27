import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { AdminRbacService } from '../services/admin-rbac.service';

export const adminMatchGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rbac = inject(AdminRbacService);

  return authService.initUser().pipe(
    map((isLoggedIn) => {
      if (!isLoggedIn) {
        return router.createUrlTree(['/login']);
      }

      if (!rbac.canAccessAdminPanel()) {
        return router.createUrlTree(['/']);
      }

      return true;
    })
  );
};
