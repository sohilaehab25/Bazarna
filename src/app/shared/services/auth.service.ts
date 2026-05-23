import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { ApiResponse, User } from '../../../app.type';

interface SignupResponse extends ApiResponse<{
    user: { _id: string; email: string; name: string };
}> {}

interface AuthResponse extends ApiResponse<{
    accessToken: string;
    user: User;
}> {}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3009/api';
    private platformId = inject(PLATFORM_ID);
    private refreshInFlight: Observable<string | null> | null = null;
    private initInFlight: Observable<boolean> | null = null;
    private authInitialized = signal(false);
    private accessToken = signal<string | null>(null);
    private csrfToken = signal<string | null>(null);
    private refreshErrorStatus = signal<number | null>(null);
    private readonly debugStorageKey = 'debug-auth';

      // 🔹 state
    private currentUser = signal<User | null>(null);

    // 🔹 public readonly state
    user$ = this.currentUser.asReadonly();
    isLoggedIn = computed(() => !!this.currentUser());

    // =========================
    // 🔐 AUTH METHODS
    // =========================

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true }).pipe(
            tap((res) => {
                if (res.data) this.setSession(res.data);
            })
        );
    }

    signup(name: string, email: string, password: string): Observable<SignupResponse> {
        return this.http.post<SignupResponse>(`${this.apiUrl}/auth/register`, { name, email, password });
    }

    verifyEmail(token: string): Observable<ApiResponse<{ user: User & { isVerified: boolean } }>> {
        return this.http.get<ApiResponse<{ user: User & { isVerified: boolean } }>>(
            `${this.apiUrl}/auth/verify-email?token=${token}`
        );
    }

    resendVerification(email: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.apiUrl}/auth/resend-verification`, { email });
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.logoutSession().subscribe();
        }
        this.clearSession();
    }

    // =========================
    // 👤 USER PROFILE
    // =========================

    userProfile(): Observable<ApiResponse<{ user: User }>> {
        return this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/users/profile`).pipe(
            tap((res) => {
                if (res.data) this.currentUser.set(res.data.user);
            })
        );
    }

    updateProfile(payload: Partial<User>): Observable<ApiResponse<{ user: User }>> {
        return this.http.put<ApiResponse<{ user: User }>>(`${this.apiUrl}/users/profile`, payload).pipe(
            tap((res) => {
                if (res.data) this.currentUser.set(res.data.user);
            })
        );
    }

    // =========================
    // 🔄 SESSION MANAGEMENT
    // =========================

    initUser(): Observable<boolean> {
        if (!isPlatformBrowser(this.platformId)) {
            this.authInitialized.set(true);
            return of(false);
        }

        if (this.authInitialized()) {
            return of(this.isLoggedIn());
        }

        if (this.initInFlight) {
            return this.initInFlight;
        }

        this.syncCsrfTokenFromCookie();
        const token = this.getAccessToken();

        if (token && this.currentUser()) {
            this.authInitialized.set(true);
            return of(true);
        }

        this.logAuthDebug('init start', {
            hasAccessToken: !!token,
            hasCsrfCookie: !!this.csrfToken(),
        });

        const request$ = this.refreshAccessToken().pipe(
            map((newToken) => !!newToken),
            tap((isAuthenticated) => {
                if (isAuthenticated) return;
                if (this.shouldLogoutAfterRefreshFailure()) {
                    this.logAuthDebug('init logout after refresh failure', {
                        status: this.refreshErrorStatus(),
                    });
                    this.logout();
                    return;
                }
                this.clearSession();
            }),
            finalize(() => {
                this.authInitialized.set(true);
                this.initInFlight = null;
                this.logAuthDebug('init complete', { isLoggedIn: this.isLoggedIn() });
            }),
            shareReplay(1)
        );

        this.initInFlight = request$;
        return request$;
    }

    private setSession(data: { accessToken: string; user: User }) {
        const normalizedUser: User = {
            ...data.user,
            id: data.user.id ?? data.user._id,
        };
        this.refreshErrorStatus.set(null);
        this.accessToken.set(data.accessToken);
        this.syncCsrfTokenFromCookie();
        this.currentUser.set(normalizedUser);
        this.logAuthDebug('session set', { userId: normalizedUser.id });
    }

    refreshAccessToken(): Observable<string | null> {
        if (this.refreshInFlight) return this.refreshInFlight;

        this.refreshErrorStatus.set(null);

        this.syncCsrfTokenFromCookie();

        this.logAuthDebug('refresh start', { hasCsrfCookie: !!this.csrfToken() });

        const request$ = this.http
            .post<AuthResponse>(`${this.apiUrl}/auth/refresh`, {}, {
                withCredentials: true,
                headers: this.getCsrfHeaders(),
            })
            .pipe(
                map((res) => (res.success ? res.data ?? null : null)),
                tap((data) => {
                    if (data) {
                        this.refreshErrorStatus.set(null);
                        this.setSession(data);
                        this.logAuthDebug('refresh success', { userId: data.user?.id ?? data.user?._id });
                    }
                }),
                map((data) => data?.accessToken ?? null),
                catchError((error: HttpErrorResponse) => {
                    this.refreshErrorStatus.set(error.status ?? 0);
                    this.logAuthDebug('refresh failed', { status: error.status ?? 0 });
                    return of(null);
                }),
                finalize(() => {
                    this.refreshInFlight = null;
                }),
                shareReplay(1)
            );

        this.refreshInFlight = request$;
        return request$;
    }

    // =========================
    // 🔑 TOKEN HELPERS
    // =========================

    getAccessToken(): string | null {
        return this.accessToken();
    }

    private logoutSession(): Observable<void> {
        this.syncCsrfTokenFromCookie();
        return this.http.post<ApiResponse>(`${this.apiUrl}/auth/logout`, {}, {
            withCredentials: true,
            headers: this.getCsrfHeaders(),
        }).pipe(
            catchError(() => of(null)),
            map(() => undefined)
        );
    }

    private clearSession(): void {
        this.accessToken.set(null);
        this.currentUser.set(null);
        this.csrfToken.set(null);
        this.refreshErrorStatus.set(null);
        this.logAuthDebug('session cleared');
    }

    shouldLogoutAfterRefreshFailure(): boolean {
        const status = this.refreshErrorStatus();
        return status === 401 || status === 403;
    }

    private isDebugEnabled(): boolean {
        if (!isPlatformBrowser(this.platformId)) return false;
        return window.localStorage.getItem(this.debugStorageKey) === 'true';
    }

    private logAuthDebug(message: string, details?: Record<string, unknown>): void {
        if (!this.isDebugEnabled()) return;
        if (details) {
            console.debug(`[auth] ${message}`, details);
            return;
        }
        console.debug(`[auth] ${message}`);
    }

    private syncCsrfTokenFromCookie(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const csrfToken = this.readCookieValue('csrf_token');
        if (csrfToken) {
            this.csrfToken.set(csrfToken);
        }
    }

    private getCsrfHeaders(): { [header: string]: string } | undefined {
        const token = this.csrfToken();
        return token ? { 'X-CSRF-Token': token } : undefined;
    }

    private readCookieValue(name: string): string | null {
        if (!isPlatformBrowser(this.platformId)) return null;

        const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
        const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
        if (!target) return null;

        return decodeURIComponent(target.substring(name.length + 1));
    }
}