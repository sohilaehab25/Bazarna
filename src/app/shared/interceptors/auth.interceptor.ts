import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SessionActivityService } from '../services/session-activity.service';
import { catchError, switchMap, throwError } from 'rxjs';

const AUTH_RETRY_CONTEXT = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const sessionActivity = inject(SessionActivityService);
    const token = authService.getAccessToken();
    const isAuthEndpoint = req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout') ||
        req.url.includes('/auth/verify-email') ||
        req.url.includes('/auth/resend-verification');
    const isRetryRequest = req.context.get(AUTH_RETRY_CONTEXT);

    sessionActivity.recordApiActivity();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401 || isAuthEndpoint || isRetryRequest) {
                return throwError(() => error);
            }

            return authService.refreshAccessToken().pipe(
                switchMap((newToken) => {
                    if (!newToken) {
                        if (authService.shouldLogoutAfterRefreshFailure()) {
                            authService.logout();
                        }
                        return throwError(() => error);
                    }

                    const retryRequest = req.clone({
                        setHeaders: {
                            Authorization: `Bearer ${newToken}`
                        },
                        context: req.context.set(AUTH_RETRY_CONTEXT, true)
                    });

                    return next(retryRequest);
                }),
                catchError((refreshError) => {
                    if (authService.shouldLogoutAfterRefreshFailure()) {
                        authService.logout();
                    }
                    return throwError(() => refreshError);
                })
            );
        })
    );
};