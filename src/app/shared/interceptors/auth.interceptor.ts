import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SessionActivityService } from '../services/session-activity.service';
import { catchError, switchMap, throwError } from 'rxjs';

const AUTH_RETRY_CONTEXT = new HttpContextToken<boolean>(() => false);
const DEBUG_STORAGE_KEY = 'debug-auth';

const isDebugEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
};

const logAuthDebug = (message: string, details?: Record<string, unknown>): void => {
    if (!isDebugEnabled()) return;
    if (details) {
        console.debug(`[auth] ${message}`, details);
        return;
    }
    console.debug(`[auth] ${message}`);
};

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

    logAuthDebug('interceptor request', {
        url: req.url,
        hasToken: !!token,
        isAuthEndpoint,
        isRetryRequest,
    });

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
                logAuthDebug('interceptor passthrough', { url: req.url, status: error.status });
                return throwError(() => error);
            }

            logAuthDebug('interceptor 401 - attempting refresh', { url: req.url });
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