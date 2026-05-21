import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.initUser().pipe(
      map((isLoggedIn) => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
        }
        return isLoggedIn;
      })
    );
  }
}